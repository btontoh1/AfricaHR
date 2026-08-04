import { ConflictException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PayRun, Payslip, PayslipLineItem } from '@prisma/client';
import { AuditService } from '@africahr/platform-audit';
import {
  PayRunRepository,
  PayrollEmployeeRepository,
  PayslipLineItemRepository,
  PayslipRepository,
  StatutoryRateRepository,
  StatutoryTaxBandRepository,
} from '@africahr/payroll-data-access';
import { computePayslip, isPayRunEditable, PayRunStatus } from '@africahr/payroll-domain';
import { CreatePayslipLineItemDto } from './dto/create-payslip-line-item.dto';

/** A payslip only carries payRunId - callers displaying a payslip (rather than mutating it) also need the pay run's dates, so this is what the read-facing methods below return. */
export type PayslipWithPeriod = Payslip & {
  periodStart: Date;
  periodEnd: Date;
  payDate: Date;
};

function mergePeriod(payslip: Payslip, payRun: PayRun): PayslipWithPeriod {
  return {
    ...payslip,
    periodStart: payRun.periodStart,
    periodEnd: payRun.periodEnd,
    payDate: payRun.payDate,
  };
}

@Injectable()
export class PayslipService {
  constructor(
    private readonly payslips: PayslipRepository,
    private readonly lineItems: PayslipLineItemRepository,
    private readonly payRuns: PayRunRepository,
    private readonly employees: PayrollEmployeeRepository,
    private readonly taxBands: StatutoryTaxBandRepository,
    private readonly rates: StatutoryRateRepository,
    private readonly audit: AuditService,
  ) {}

  async findById(tenantId: string, id: string): Promise<Payslip> {
    const payslip = await this.payslips.findById(tenantId, id);
    if (!payslip) {
      throw new NotFoundException(`Payslip "${id}" not found`);
    }
    return payslip;
  }

  /** Same lookup as findById, but for display rather than mutation - includes the pay run's period. */
  async findByIdWithPeriod(tenantId: string, id: string): Promise<PayslipWithPeriod> {
    const payslip = await this.findById(tenantId, id);
    const payRun = await this.payRuns.findById(tenantId, payslip.payRunId);
    if (!payRun) {
      throw new NotFoundException(`Pay run "${payslip.payRunId}" not found`);
    }
    return mergePeriod(payslip, payRun);
  }

  async listByPayRun(tenantId: string, payRunId: string): Promise<PayslipWithPeriod[]> {
    const payslips = await this.payslips.listByPayRun(tenantId, payRunId);
    return this.withPeriods(tenantId, payslips);
  }

  async listByEmployee(tenantId: string, employeeId: string): Promise<PayslipWithPeriod[]> {
    const payslips = await this.payslips.listByEmployee(tenantId, employeeId);
    return this.withPeriods(tenantId, payslips);
  }

  async resolveOwnEmployeeId(tenantId: string, userId: string): Promise<string> {
    const employee = await this.employees.findByUserId(tenantId, userId);
    if (!employee) {
      throw new ForbiddenException('No employee record is linked to this account');
    }
    return employee.id;
  }

  async listForSelf(tenantId: string, userId: string): Promise<PayslipWithPeriod[]> {
    const employeeId = await this.resolveOwnEmployeeId(tenantId, userId);
    return this.listByEmployee(tenantId, employeeId);
  }

  async findByIdForSelf(tenantId: string, userId: string, id: string): Promise<PayslipWithPeriod> {
    const employeeId = await this.resolveOwnEmployeeId(tenantId, userId);
    // Ownership check first, against the plain (unenriched) lookup, so a
    // payslip belonging to someone else 404s before we bother fetching its
    // pay run.
    const payslip = await this.findById(tenantId, id);
    if (payslip.employeeId !== employeeId) {
      // Don't reveal that a payslip belonging to someone else exists.
      throw new NotFoundException(`Payslip "${id}" not found`);
    }
    return this.findByIdWithPeriod(tenantId, id);
  }

  /** Batches one query for every distinct pay run behind a list of payslips, rather than one query per payslip. */
  private async withPeriods(tenantId: string, payslips: Payslip[]): Promise<PayslipWithPeriod[]> {
    const payRunIds = [...new Set(payslips.map((payslip) => payslip.payRunId))];
    const payRuns = await this.payRuns.findManyByIds(tenantId, payRunIds);
    const payRunById = new Map(payRuns.map((payRun) => [payRun.id, payRun]));

    return payslips.map((payslip) => {
      const payRun = payRunById.get(payslip.payRunId);
      if (!payRun) {
        throw new NotFoundException(`Pay run "${payslip.payRunId}" not found`);
      }
      return mergePeriod(payslip, payRun);
    });
  }

  async addLineItem(
    tenantId: string,
    payslipId: string,
    dto: CreatePayslipLineItemDto,
    actorId?: string,
  ): Promise<PayslipLineItem> {
    const payslip = await this.findById(tenantId, payslipId);
    await this.assertPayRunEditable(tenantId, payslip.payRunId);

    const lineItem = await this.lineItems.create(tenantId, {
      payslipId,
      type: dto.type,
      code: dto.code,
      description: dto.description,
      amount: dto.amount,
      createdBy: actorId,
    });

    await this.recompute(tenantId, payslip);

    await this.audit.record({
      tenantId,
      actorUserId: actorId ?? null,
      action: 'payroll.payslip.line_item_added',
      resourceType: 'Payslip',
      resourceId: payslipId,
      metadata: { type: dto.type, code: dto.code, amount: dto.amount },
    });

    return lineItem;
  }

  async removeLineItem(
    tenantId: string,
    payslipId: string,
    lineItemId: string,
    actorId?: string,
  ): Promise<void> {
    const payslip = await this.findById(tenantId, payslipId);
    await this.assertPayRunEditable(tenantId, payslip.payRunId);

    const lineItem = await this.lineItems.findById(tenantId, lineItemId);
    if (!lineItem || lineItem.payslipId !== payslipId) {
      throw new NotFoundException(`Line item "${lineItemId}" not found on this payslip`);
    }

    await this.lineItems.delete(tenantId, lineItemId);
    await this.recompute(tenantId, payslip);

    await this.audit.record({
      tenantId,
      actorUserId: actorId ?? null,
      action: 'payroll.payslip.line_item_removed',
      resourceType: 'Payslip',
      resourceId: payslipId,
    });
  }

  private async assertPayRunEditable(tenantId: string, payRunId: string): Promise<void> {
    const payRun = await this.payRuns.findById(tenantId, payRunId);
    if (!payRun || !isPayRunEditable(payRun.status as PayRunStatus)) {
      throw new ConflictException('Cannot modify line items once the pay run is locked');
    }
  }

  private async recompute(tenantId: string, payslip: Payslip): Promise<void> {
    const payRun = await this.payRuns.findById(tenantId, payslip.payRunId);
    if (!payRun) {
      throw new NotFoundException(`Pay run "${payslip.payRunId}" not found`);
    }

    const employee = await this.employees.findById(tenantId, payslip.employeeId);
    if (!employee) {
      throw new NotFoundException(`Employee "${payslip.employeeId}" not found`);
    }

    const asOf = payRun.payDate;
    const bands = await this.taxBands.findEffective(employee.countryCode, asOf);
    const employeeRate = await this.rates.findEffective(employee.countryCode, 'SSNIT_EMPLOYEE', asOf);
    const employerRate = await this.rates.findEffective(employee.countryCode, 'SSNIT_EMPLOYER', asOf);

    if (bands.length === 0 || !employeeRate || !employerRate) {
      throw new ConflictException(
        `No effective statutory tax/SSNIT configuration for country "${employee.countryCode}" as of ${asOf.toISOString()}`,
      );
    }

    const extraRates = await this.fetchExtraStatutoryRates(employee.countryCode, asOf);
    const organizationEmployeeCount =
      (await this.employees.listActiveByOrganization(tenantId, employee.organizationId)).length;

    const currentLineItems = await this.lineItems.listByPayslip(tenantId, payslip.id);

    const computed = computePayslip({
      countryCode: employee.countryCode,
      basicSalary: employee.baseSalary ? Number(employee.baseSalary) : 0,
      annualRentPaid: employee.annualRentPaid ? Number(employee.annualRentPaid) : undefined,
      organizationEmployeeCount,
      ...extraRates,
      lineItems: currentLineItems.map((item) => ({ type: item.type, amount: Number(item.amount) })),
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
      payRunId: payslip.payRunId,
      employeeId: payslip.employeeId,
      countryCode: employee.countryCode,
      currency: employee.currency ?? payslip.currency,
      ...computed,
    });
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
}
