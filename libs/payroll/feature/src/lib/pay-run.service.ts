import { BadRequestException, ConflictException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { randomUUID } from 'node:crypto';
import {
  PayRun,
  PayRunStatus as PrismaPayRunStatus,
  PayslipDisbursementStatus,
  PayslipStatus,
  Prisma,
} from '@prisma/client';
import { AppConfigService, decryptAesGcm, deriveEncryptionKey } from '@africahr/platform-core';
import { AuditService } from '@africahr/platform-audit';
import {
  PayrollBenefitEnrollmentRepository,
  PayrollEligibleEmployee,
  PayrollEmployeePaymentMethod,
  PayRunRepository,
  PayrollEmployeeRepository,
  PayslipRepository,
  PayslipWithLineItems,
  StatutoryRateRepository,
  StatutoryTaxBandRepository,
} from '@africahr/payroll-data-access';
import {
  BenefitEnrollmentContribution,
  canTransitionPayRunStatus,
  computePayslip,
  getDefaultCurrencyForCountry,
  isPayRunEditable,
  PayRunStatus,
  resolvePaystackRecipientType,
} from '@africahr/payroll-domain';
import { CreatePayRunDto } from './dto/create-pay-run.dto';
import { PaystackTransferClient } from './paystack-transfer-client';
import { buildDisbursementFailedEvent, PAYROLL_DISBURSEMENT_FAILED_EVENT } from './payroll-transfer-webhook.listener';

/** BANK_ACCOUNT uses accountNumber; MOBILE_MONEY uses the phone number Paystack treats as the recipient's "account number." */
function resolveAccountNumber(paymentMethod: PayrollEmployeePaymentMethod | null): string | null {
  if (!paymentMethod) {
    return null;
  }
  return paymentMethod.type === 'BANK_ACCOUNT' ? paymentMethod.accountNumber : paymentMethod.mobileMoneyNumber;
}

function translateReferenceError(error: unknown, organizationId: string): never {
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    if (error.code === 'P2003') {
      throw new NotFoundException(`Organization "${organizationId}" not found`);
    }
    if (error.code === 'P2002') {
      throw new ConflictException('A pay run already exists for this organization and period');
    }
  }
  throw error;
}

/**
 * Emitted the first time a pay run finishes processing (DRAFT ->
 * PROCESSING), not on later idempotent re-processing of the same run
 * (e.g. after a new hire - see process()'s docstring) - a repeat run
 * doesn't need repeat "ready for approval" notifications. Every pay-run
 * action shares one permission (PAYROLL_MANAGE - see
 * pay-run.controller.ts), so unlike leave/performance there's no separate
 * "requester vs approver" role here: processing and approving are done
 * by the same pool of tenant admins/payroll managers, sometimes the same
 * person. actorUserId lets the listener skip notifying whoever just
 * processed the run. Consumed by a listener living in
 * notifications-feature - scope:payroll is not allowed to depend on
 * scope:notifications (see eslint.config.mjs module boundaries), so this
 * event is the decoupling point between the two.
 */
export const PAY_RUN_PROCESSED_EVENT = 'payroll.pay_run.processed';

export interface PayRunProcessedEvent {
  tenantId: string;
  payRunId: string;
  periodStart: string;
  periodEnd: string;
  employeeCount: number;
  actorUserId: string | null;
}

@Injectable()
export class PayRunService {
  private readonly logger = new Logger(PayRunService.name);
  private readonly paymentMethodEncryptionKey: Buffer;

  constructor(
    private readonly payRuns: PayRunRepository,
    private readonly payslips: PayslipRepository,
    private readonly employees: PayrollEmployeeRepository,
    private readonly taxBands: StatutoryTaxBandRepository,
    private readonly rates: StatutoryRateRepository,
    private readonly benefitEnrollments: PayrollBenefitEnrollmentRepository,
    private readonly audit: AuditService,
    private readonly eventEmitter: EventEmitter2,
    private readonly paystack: PaystackTransferClient,
    config: AppConfigService,
  ) {
    // Derived once at construction (Nest instantiates providers eagerly).
    // scope:payroll cannot depend on scope:employee (Nx module boundary),
    // so this service can't reuse employee-feature's PaymentMethodService
    // - it derives its own copy of the same key (same
    // PAYMENT_METHOD_ENCRYPTION_KEY env var) to decrypt the payment
    // method fields it reads directly from the shared table (see
    // PayrollEmployeeRepository.findPaymentMethodByEmployeeId).
    this.paymentMethodEncryptionKey = deriveEncryptionKey(
      config.paymentMethodEncryptionKey,
      'PAYMENT_METHOD_ENCRYPTION_KEY',
    );
  }

  async create(tenantId: string, dto: CreatePayRunDto, actorId?: string): Promise<PayRun> {
    const periodStart = new Date(dto.periodStart);
    const periodEnd = new Date(dto.periodEnd);
    if (periodEnd <= periodStart) {
      throw new BadRequestException('periodEnd must be after periodStart');
    }

    let payRun: PayRun;
    try {
      payRun = await this.payRuns.create(tenantId, {
        organizationId: dto.organizationId,
        periodStart,
        periodEnd,
        payDate: new Date(dto.payDate),
        createdBy: actorId,
      });
    } catch (error) {
      translateReferenceError(error, dto.organizationId);
    }

    await this.audit.record({
      tenantId,
      actorUserId: actorId ?? null,
      action: 'payroll.pay_run.created',
      resourceType: 'PayRun',
      resourceId: payRun.id,
    });

    return payRun;
  }

  async findById(tenantId: string, id: string): Promise<PayRun> {
    const payRun = await this.payRuns.findById(tenantId, id);
    if (!payRun) {
      throw new NotFoundException(`Pay run "${id}" not found`);
    }
    return payRun;
  }

  list(tenantId: string, params: { organizationId?: string } = {}): Promise<PayRun[]> {
    return this.payRuns.list(tenantId, params);
  }

  /**
   * Computes/recomputes a payslip for every active employee in the run's
   * organization. Safe to call repeatedly while the run is DRAFT/PROCESSING
   * (e.g. after a new hire or a line-item change) — each call upserts on
   * (payRunId, employeeId) and preserves that employee's existing line
   * items rather than clearing them.
   */
  async process(tenantId: string, id: string, actorId?: string): Promise<PayRun> {
    const payRun = await this.findById(tenantId, id);
    if (!isPayRunEditable(payRun.status as PayRunStatus)) {
      throw new ConflictException(`Cannot process a pay run in status ${payRun.status}`);
    }

    const eligibleEmployees = await this.employees.listActiveByOrganization(
      tenantId,
      payRun.organizationId,
    );

    for (const employee of eligibleEmployees) {
      const basicSalary = employee.baseSalary ? Number(employee.baseSalary) : 0;
      const currency = employee.currency ?? getDefaultCurrencyForCountry(employee.countryCode);
      const asOf = payRun.payDate;

      const bands = await this.taxBands.findEffective(employee.countryCode, asOf);
      const employeeRate = await this.rates.findEffective(employee.countryCode, 'SSNIT_EMPLOYEE', asOf);
      const employerRate = await this.rates.findEffective(employee.countryCode, 'SSNIT_EMPLOYER', asOf);

      if (bands.length === 0 || !employeeRate || !employerRate) {
        throw new ConflictException(
          `No effective statutory tax/SSNIT configuration for country "${employee.countryCode}" as of ${asOf.toISOString()} — add StatutoryTaxBand/StatutoryRate records before processing this run`,
        );
      }

      const extraRates = await this.fetchExtraStatutoryRates(employee.countryCode, asOf);
      const benefitEnrollments = await this.fetchBenefitEnrollments(tenantId, employee.id, asOf);

      const existingPayslip = await this.payslips.findByPayRunAndEmployee(tenantId, id, employee.id);
      const lineItemInputs = (existingPayslip?.lineItems ?? []).map((item) => ({
        type: item.type,
        amount: Number(item.amount),
      }));

      const computed = computePayslip({
        countryCode: employee.countryCode,
        basicSalary,
        annualRentPaid: employee.annualRentPaid ? Number(employee.annualRentPaid) : undefined,
        organizationEmployeeCount: eligibleEmployees.length,
        ...extraRates,
        benefitEnrollments,
        lineItems: lineItemInputs,
        taxBands: bands.map((band) => ({
          order: band.order,
          lowerBound: Number(band.lowerBound),
          upperBound: band.upperBound === null ? null : Number(band.upperBound),
          rate: Number(band.rate),
        })),
        ssnitRates: {
          employeeRate: Number(employeeRate.rate),
          employerRate: Number(employerRate.rate),
        },
      });

      await this.payslips.upsert(tenantId, {
        payRunId: id,
        employeeId: employee.id,
        countryCode: employee.countryCode,
        currency,
        actorId,
        ...computed,
      });
    }

    const isFirstProcessing = payRun.status === PrismaPayRunStatus.DRAFT;
    const updated = isFirstProcessing
      ? await this.payRuns.updateStatus(tenantId, id, {
          status: PrismaPayRunStatus.PROCESSING,
          updatedBy: actorId,
        })
      : payRun;

    await this.audit.record({
      tenantId,
      actorUserId: actorId ?? null,
      action: 'payroll.pay_run.processed',
      resourceType: 'PayRun',
      resourceId: id,
      metadata: { employeeCount: eligibleEmployees.length },
    });

    if (isFirstProcessing) {
      const event: PayRunProcessedEvent = {
        tenantId,
        payRunId: id,
        periodStart: payRun.periodStart.toISOString().slice(0, 10),
        periodEnd: payRun.periodEnd.toISOString().slice(0, 10),
        employeeCount: eligibleEmployees.length,
        actorUserId: actorId ?? null,
      };
      this.eventEmitter.emit(PAY_RUN_PROCESSED_EVENT, event);
    }

    return updated;
  }

  /**
   * Ghana Tier 2, Kenya SHIF/Housing Levy, and Nigeria's NSITF/NHIS are
   * mandatory once a country has StatutoryRate rows for them, but unlike
   * SSNIT/NSSF (fetched unconditionally for every country above) they
   * only apply to their own country - fetched conditionally here, and
   * required (throws if missing, same fail-loud posture as the SSNIT/NSSF
   * check above) only for the country they apply to. Nigeria's rates are
   * required unconditionally here too, same as Ghana/Kenya's - whether
   * they actually apply to a given payslip (the 5-employee organization
   * threshold, and for NHIS, the employee's own basic salary) is decided
   * inside computePayslip, not here.
   */
  private async fetchExtraStatutoryRates(
    countryCode: string,
    asOf: Date,
  ): Promise<{
    ghanaTier2Rate?: number;
    kenyaShifRate?: number;
    kenyaHousingLevyEmployeeRate?: number;
    kenyaHousingLevyEmployerRate?: number;
    nigeriaNsitfRate?: number;
    nigeriaNhisEmployeeRate?: number;
    nigeriaNhisEmployerRate?: number;
  }> {
    if (countryCode === 'GH') {
      const tier2Rate = await this.rates.findEffective(countryCode, 'GHANA_TIER2_PENSION_EMPLOYER', asOf);
      if (!tier2Rate) {
        throw new ConflictException(
          `No effective Ghana Tier 2 pension rate as of ${asOf.toISOString()} — add a StatutoryRate record before processing this run`,
        );
      }
      return { ghanaTier2Rate: Number(tier2Rate.rate) };
    }

    if (countryCode === 'KE') {
      const shifRate = await this.rates.findEffective(countryCode, 'KENYA_SHIF_EMPLOYEE', asOf);
      const housingEmployeeRate = await this.rates.findEffective(countryCode, 'KENYA_HOUSING_LEVY_EMPLOYEE', asOf);
      const housingEmployerRate = await this.rates.findEffective(countryCode, 'KENYA_HOUSING_LEVY_EMPLOYER', asOf);
      if (!shifRate || !housingEmployeeRate || !housingEmployerRate) {
        throw new ConflictException(
          `No effective Kenya SHIF/Housing Levy rates as of ${asOf.toISOString()} — add StatutoryRate records before processing this run`,
        );
      }
      return {
        kenyaShifRate: Number(shifRate.rate),
        kenyaHousingLevyEmployeeRate: Number(housingEmployeeRate.rate),
        kenyaHousingLevyEmployerRate: Number(housingEmployerRate.rate),
      };
    }

    if (countryCode === 'NG') {
      const nsitfRate = await this.rates.findEffective(countryCode, 'NIGERIA_NSITF_EMPLOYER', asOf);
      const nhisEmployeeRate = await this.rates.findEffective(countryCode, 'NIGERIA_NHIS_EMPLOYEE', asOf);
      const nhisEmployerRate = await this.rates.findEffective(countryCode, 'NIGERIA_NHIS_EMPLOYER', asOf);
      if (!nsitfRate || !nhisEmployeeRate || !nhisEmployerRate) {
        throw new ConflictException(
          `No effective Nigeria NSITF/NHIS rates as of ${asOf.toISOString()} — add StatutoryRate records before processing this run`,
        );
      }
      return {
        nigeriaNsitfRate: Number(nsitfRate.rate),
        nigeriaNhisEmployeeRate: Number(nhisEmployeeRate.rate),
        nigeriaNhisEmployerRate: Number(nhisEmployerRate.rate),
      };
    }

    return {};
  }

  /** Every active BenefitEnrollment for this employee as of the pay date, converted to the plain-number shape computePayslip expects (Decimal->number conversion happens at this boundary, not in domain logic). */
  private async fetchBenefitEnrollments(
    tenantId: string,
    employeeId: string,
    asOf: Date,
  ): Promise<BenefitEnrollmentContribution[]> {
    const enrollments = await this.benefitEnrollments.listActiveForEmployee(tenantId, employeeId, asOf);
    return enrollments.map((enrollment) => ({
      contributionType: enrollment.contributionType,
      employeeContribution: Number(enrollment.employeeContribution),
      employerContribution: Number(enrollment.employerContribution),
    }));
  }

  async approve(tenantId: string, id: string, actorId?: string): Promise<PayRun> {
    const payRun = await this.findById(tenantId, id);
    this.assertTransition(payRun.status, PayRunStatus.APPROVED);

    const payslips = await this.payslips.listByPayRun(tenantId, id);
    if (payslips.length === 0) {
      throw new ConflictException('Cannot approve a pay run with no payslips — process it first');
    }

    const updated = await this.payRuns.updateStatus(tenantId, id, {
      status: PrismaPayRunStatus.APPROVED,
      approvedAt: new Date(),
      approvedBy: actorId,
      updatedBy: actorId,
    });
    await this.payslips.updateManyStatusByPayRun(tenantId, id, PayslipStatus.APPROVED, actorId);

    await this.audit.record({
      tenantId,
      actorUserId: actorId ?? null,
      action: 'payroll.pay_run.approved',
      resourceType: 'PayRun',
      resourceId: id,
    });

    return updated;
  }

  async markPaid(tenantId: string, id: string, actorId?: string): Promise<PayRun> {
    const payRun = await this.findById(tenantId, id);
    this.assertTransition(payRun.status, PayRunStatus.PAID);

    const updated = await this.payRuns.updateStatus(tenantId, id, {
      status: PrismaPayRunStatus.PAID,
      paidAt: new Date(),
      updatedBy: actorId,
    });
    await this.payslips.updateManyStatusByPayRun(tenantId, id, PayslipStatus.PAID, actorId);

    await this.audit.record({
      tenantId,
      actorUserId: actorId ?? null,
      action: 'payroll.pay_run.paid',
      resourceType: 'PayRun',
      resourceId: id,
    });

    await this.initiateDisbursements(tenantId, id);

    return updated;
  }

  /**
   * Best-effort: initiates a Paystack Transfer for every payslip with
   * netPay > 0, skipping (not failing the whole markPaid() call) an
   * employee with no usable payment method, and isolating one employee's
   * Paystack failure from the rest via a per-employee try/catch - the
   * pay run has already been administratively marked PAID by this point,
   * and one bad account number shouldn't block paying everyone else.
   * disbursementStatus stays NOT_INITIATED (its DB default) for anyone
   * skipped or whose recipient couldn't be created; PENDING is recorded
   * just before a transfer is attempted (see disburse()'s docstring for
   * why it's before, not after), and the transfer.success/transfer.failed
   * webhook (or the reconciliation sweep) moves it to SUCCESS/FAILED later
   * (see PayrollTransferWebhookListener).
   */
  private async initiateDisbursements(tenantId: string, payRunId: string): Promise<void> {
    const payslips = await this.payslips.listByPayRun(tenantId, payRunId);

    for (const payslip of payslips) {
      if (Number(payslip.netPay) <= 0) {
        continue;
      }

      try {
        await this.disburse(tenantId, payslip);
      } catch (error) {
        this.logger.error(
          `Failed to initiate Paystack transfer for payslip "${payslip.id}" (employee "${payslip.employeeId}")`,
          error as Error,
        );
      }
    }
  }

  private async disburse(tenantId: string, payslip: PayslipWithLineItems): Promise<void> {
    const encryptedPaymentMethod = await this.employees.findPaymentMethodByEmployeeId(
      tenantId,
      payslip.employeeId,
    );
    const paymentMethod = this.decryptPaymentMethod(encryptedPaymentMethod);
    const accountNumber = resolveAccountNumber(paymentMethod);
    if (!paymentMethod || !paymentMethod.bankCode || !accountNumber) {
      return;
    }

    const recipientType = resolvePaystackRecipientType(payslip.countryCode, paymentMethod.type);
    if (!recipientType) {
      this.logger.warn(
        `No Paystack transfer recipient type for country "${payslip.countryCode}" / method "${paymentMethod.type}" - skipping payslip "${payslip.id}"`,
      );
      return;
    }

    const employee = await this.employees.findById(tenantId, payslip.employeeId);
    if (!employee) {
      return;
    }

    // Reuse a recipient already created against these exact payment-method
    // details rather than calling Paystack's Create Transfer Recipient
    // endpoint again on every pay run - encryptedPaymentMethod carries it
    // straight through since it isn't one of the encrypted fields (see
    // EmployeePaymentMethod.paystackRecipientCode's schema comment), and it's
    // cleared to null the moment the employee edits their payment method.
    let recipientCode = encryptedPaymentMethod?.paystackRecipientCode ?? null;
    if (!recipientCode) {
      try {
        const recipient = await this.paystack.createRecipient({
          type: recipientType,
          name: paymentMethod.accountName ?? `${employee.firstName} ${employee.lastName}`,
          accountNumber,
          bankCode: paymentMethod.bankCode,
          currency: payslip.currency,
        });
        recipientCode = recipient.recipientCode;
        await this.employees.savePaystackRecipientCode(tenantId, payslip.employeeId, recipientCode);
      } catch (error) {
        this.logger.error(
          `Failed to create Paystack transfer recipient for payslip "${payslip.id}" (employee "${payslip.employeeId}")`,
          error as Error,
        );
        await this.markDisbursementInitiationFailed(tenantId, payslip, employee);
        return;
      }
    }

    // Recorded PENDING *before* calling Paystack, not after - a crash
    // between the Paystack call succeeding and a later write would
    // otherwise leave real money already sent with zero local record of
    // it, and nothing would stop a later retry from sending a second
    // transfer. Committing the reference first closes that window: a
    // crash on either side of the call below leaves this payslip PENDING,
    // which only the reconciliation sweep's direct Paystack verification
    // is allowed to resolve (retryDisbursement's FAILED/NOT_INITIATED
    // guard deliberately excludes PENDING, so a human can't retry an
    // in-flight disbursement either).
    const reference = randomUUID();
    await this.payslips.recordDisbursementInitiated(tenantId, payslip.id, {
      paystackRecipientCode: recipientCode,
      paystackTransferReference: reference,
    });

    try {
      await this.paystack.initiateTransfer({
        amount: Number(payslip.netPay),
        currency: payslip.currency,
        recipientCode,
        reference,
        reason: `Payslip for pay run ${payslip.payRunId}`,
      });
    } catch (error) {
      // Deliberately left PENDING, not marked FAILED: a rejected request
      // and a network failure that Paystack may have still processed look
      // identical here, and marking this FAILED without being sure would
      // let a human retry it into a duplicate transfer. The reconciliation
      // sweep resolves it definitively via Paystack's own Verify Transfer
      // endpoint once it's reachable - see
      // PayrollTransferWebhookListener.reconcileStalePendingDisbursements.
      this.logger.error(
        `Paystack transfer initiation errored for payslip "${payslip.id}" (employee "${payslip.employeeId}") - left PENDING for reconciliation to resolve`,
        error as Error,
      );
    }
  }

  /**
   * Only reached from a recipient-creation failure (bad bank code/account
   * number, Paystack outage) - unambiguous and unconcerned with the
   * duplicate-transfer risk disburse()'s own initiateTransfer catch has to
   * worry about, since no transfer reference has been committed yet at
   * this point. Marking it FAILED surfaces it (same notification tenant
   * admins/payroll managers get for a transfer that failed after
   * initiating - see PAYROLL_DISBURSEMENT_FAILED_EVENT) and makes it
   * eligible for retryDisbursement() below, instead of leaving it at
   * NOT_INITIATED indefinitely with nothing to revisit it.
   */
  private async markDisbursementInitiationFailed(
    tenantId: string,
    payslip: PayslipWithLineItems,
    employee: PayrollEligibleEmployee,
  ): Promise<void> {
    await this.payslips.recordDisbursementResult(tenantId, payslip.id, PayslipDisbursementStatus.FAILED);

    const payRun = await this.payRuns.findById(tenantId, payslip.payRunId);
    if (!payRun) {
      return;
    }
    this.eventEmitter.emit(
      PAYROLL_DISBURSEMENT_FAILED_EVENT,
      buildDisbursementFailedEvent(tenantId, employee, payRun),
    );
  }

  /**
   * Lets a payroll manager retry a single payslip's disbursement after
   * fixing whatever caused it to fail (e.g. the employee corrected their
   * bank details) - see markDisbursementInitiationFailed's docstring for
   * why this isn't automatic. Restricted to FAILED/NOT_INITIATED so a
   * disbursement that's already PENDING or SUCCESS can never be retried
   * into a duplicate transfer.
   */
  async retryDisbursement(tenantId: string, payslipId: string, actorId?: string): Promise<void> {
    const payslip = await this.payslips.findById(tenantId, payslipId);
    if (!payslip) {
      throw new NotFoundException(`Payslip "${payslipId}" not found`);
    }
    if (
      payslip.disbursementStatus !== PayslipDisbursementStatus.FAILED &&
      payslip.disbursementStatus !== PayslipDisbursementStatus.NOT_INITIATED
    ) {
      throw new ConflictException(
        `Cannot retry a disbursement in status ${payslip.disbursementStatus} - it must be FAILED or NOT_INITIATED`,
      );
    }

    const payRun = await this.findById(tenantId, payslip.payRunId);
    if (payRun.status !== PrismaPayRunStatus.PAID) {
      throw new ConflictException(`Cannot retry a disbursement for a pay run in status ${payRun.status}`);
    }

    await this.disburse(tenantId, payslip);

    await this.audit.record({
      tenantId,
      actorUserId: actorId ?? null,
      action: 'payroll.payslip.disbursement_retried',
      resourceType: 'Payslip',
      resourceId: payslip.id,
    });
  }

  /** bankCode/accountNumber/accountName/mobileMoneyNumber are encrypted at rest (see PaymentMethodService) - decrypted here before they're used to build a Paystack recipient. */
  private decryptPaymentMethod(
    paymentMethod: PayrollEmployeePaymentMethod | null,
  ): PayrollEmployeePaymentMethod | null {
    if (!paymentMethod) {
      return null;
    }
    const decrypt = (value: string | null) =>
      value ? decryptAesGcm(value, this.paymentMethodEncryptionKey) : value;
    return {
      ...paymentMethod,
      bankCode: decrypt(paymentMethod.bankCode),
      accountNumber: decrypt(paymentMethod.accountNumber),
      accountName: decrypt(paymentMethod.accountName),
      mobileMoneyNumber: decrypt(paymentMethod.mobileMoneyNumber),
    };
  }

  async close(tenantId: string, id: string, actorId?: string): Promise<PayRun> {
    const payRun = await this.findById(tenantId, id);
    this.assertTransition(payRun.status, PayRunStatus.CLOSED);

    const updated = await this.payRuns.updateStatus(tenantId, id, {
      status: PrismaPayRunStatus.CLOSED,
      updatedBy: actorId,
    });

    await this.audit.record({
      tenantId,
      actorUserId: actorId ?? null,
      action: 'payroll.pay_run.closed',
      resourceType: 'PayRun',
      resourceId: id,
    });

    return updated;
  }

  async cancel(tenantId: string, id: string, actorId?: string): Promise<PayRun> {
    const payRun = await this.findById(tenantId, id);
    this.assertTransition(payRun.status, PayRunStatus.CANCELLED);

    const updated = await this.payRuns.updateStatus(tenantId, id, {
      status: PrismaPayRunStatus.CANCELLED,
      updatedBy: actorId,
    });

    await this.audit.record({
      tenantId,
      actorUserId: actorId ?? null,
      action: 'payroll.pay_run.cancelled',
      resourceType: 'PayRun',
      resourceId: id,
    });

    return updated;
  }

  private assertTransition(from: PrismaPayRunStatus, to: PayRunStatus): void {
    if (!canTransitionPayRunStatus(from as PayRunStatus, to)) {
      throw new ConflictException(`Cannot transition a pay run from ${from} to ${to}`);
    }
  }
}
