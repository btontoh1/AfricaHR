import { ConflictException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { Payslip, PayslipLineItem } from '@prisma/client';
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

  listByPayRun(tenantId: string, payRunId: string): Promise<Payslip[]> {
    return this.payslips.listByPayRun(tenantId, payRunId);
  }

  listByEmployee(tenantId: string, employeeId: string): Promise<Payslip[]> {
    return this.payslips.listByEmployee(tenantId, employeeId);
  }

  async resolveOwnEmployeeId(tenantId: string, userId: string): Promise<string> {
    const employee = await this.employees.findByUserId(tenantId, userId);
    if (!employee) {
      throw new ForbiddenException('No employee record is linked to this account');
    }
    return employee.id;
  }

  async listForSelf(tenantId: string, userId: string): Promise<Payslip[]> {
    const employeeId = await this.resolveOwnEmployeeId(tenantId, userId);
    return this.listByEmployee(tenantId, employeeId);
  }

  async findByIdForSelf(tenantId: string, userId: string, id: string): Promise<Payslip> {
    const employeeId = await this.resolveOwnEmployeeId(tenantId, userId);
    const payslip = await this.findById(tenantId, id);
    if (payslip.employeeId !== employeeId) {
      // Don't reveal that a payslip belonging to someone else exists.
      throw new NotFoundException(`Payslip "${id}" not found`);
    }
    return payslip;
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

    const currentLineItems = await this.lineItems.listByPayslip(tenantId, payslip.id);

    const computed = computePayslip({
      basicSalary: employee.baseSalary ? Number(employee.baseSalary) : 0,
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
}
