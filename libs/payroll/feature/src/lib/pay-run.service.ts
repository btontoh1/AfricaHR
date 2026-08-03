import { BadRequestException, ConflictException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { randomUUID } from 'node:crypto';
import { PayRun, PayRunStatus as PrismaPayRunStatus, PayslipStatus, Prisma } from '@prisma/client';
import { AuditService } from '@africahr/platform-audit';
import {
  PayrollEmployeePaymentMethod,
  PayRunRepository,
  PayrollEmployeeRepository,
  PayslipRepository,
  PayslipWithLineItems,
  StatutoryRateRepository,
  StatutoryTaxBandRepository,
} from '@africahr/payroll-data-access';
import {
  canTransitionPayRunStatus,
  computePayslip,
  getDefaultCurrencyForCountry,
  isPayRunEditable,
  PayRunStatus,
  resolvePaystackRecipientType,
} from '@africahr/payroll-domain';
import { CreatePayRunDto } from './dto/create-pay-run.dto';
import { PaystackTransferClient } from './paystack-transfer-client';

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

  constructor(
    private readonly payRuns: PayRunRepository,
    private readonly payslips: PayslipRepository,
    private readonly employees: PayrollEmployeeRepository,
    private readonly taxBands: StatutoryTaxBandRepository,
    private readonly rates: StatutoryRateRepository,
    private readonly audit: AuditService,
    private readonly eventEmitter: EventEmitter2,
    private readonly paystack: PaystackTransferClient,
  ) {}

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

      const existingPayslip = await this.payslips.findByPayRunAndEmployee(tenantId, id, employee.id);
      const lineItemInputs = (existingPayslip?.lineItems ?? []).map((item) => ({
        type: item.type,
        amount: Number(item.amount),
      }));

      const computed = computePayslip({
        countryCode: employee.countryCode,
        basicSalary,
        annualRentPaid: employee.annualRentPaid ? Number(employee.annualRentPaid) : undefined,
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
   * skipped; PENDING is recorded only once a transfer is actually
   * initiated, and the transfer.success/transfer.failed webhook moves it
   * to SUCCESS/FAILED later (see PayrollTransferWebhookListener).
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
    const paymentMethod = await this.employees.findPaymentMethodByEmployeeId(tenantId, payslip.employeeId);
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

    const recipient = await this.paystack.createRecipient({
      type: recipientType,
      name: paymentMethod.accountName ?? `${employee.firstName} ${employee.lastName}`,
      accountNumber,
      bankCode: paymentMethod.bankCode,
      currency: payslip.currency,
    });

    const reference = randomUUID();
    await this.paystack.initiateTransfer({
      amount: Number(payslip.netPay),
      currency: payslip.currency,
      recipientCode: recipient.recipientCode,
      reference,
      reason: `Payslip for pay run ${payslip.payRunId}`,
    });

    await this.payslips.recordDisbursementInitiated(tenantId, payslip.id, {
      paystackRecipientCode: recipient.recipientCode,
      paystackTransferReference: reference,
    });
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
