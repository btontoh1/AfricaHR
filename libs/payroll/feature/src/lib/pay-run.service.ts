import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { PayRun, PayRunStatus as PrismaPayRunStatus, PayslipStatus, Prisma } from '@prisma/client';
import { AuditService } from '@africahr/platform-audit';
import {
  PayRunRepository,
  PayrollEmployeeRepository,
  PayslipRepository,
  StatutoryRateRepository,
  StatutoryTaxBandRepository,
} from '@africahr/payroll-data-access';
import {
  canTransitionPayRunStatus,
  computePayslip,
  getDefaultCurrencyForCountry,
  isPayRunEditable,
  PayRunStatus,
} from '@africahr/payroll-domain';
import { CreatePayRunDto } from './dto/create-pay-run.dto';

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

@Injectable()
export class PayRunService {
  constructor(
    private readonly payRuns: PayRunRepository,
    private readonly payslips: PayslipRepository,
    private readonly employees: PayrollEmployeeRepository,
    private readonly taxBands: StatutoryTaxBandRepository,
    private readonly rates: StatutoryRateRepository,
    private readonly audit: AuditService,
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

    const updated =
      payRun.status === PrismaPayRunStatus.DRAFT
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

    return updated;
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
