import { Injectable } from '@nestjs/common';
import { Payslip, PayslipDisbursementStatus, PayslipStatus, Prisma } from '@prisma/client';
import { PrismaService } from '@africahr/platform-database';

export type PayslipWithLineItems = Prisma.PayslipGetPayload<{ include: { lineItems: true } }>;

export interface UpsertPayslipInput {
  payRunId: string;
  employeeId: string;
  countryCode: string;
  basicSalary: Prisma.Decimal | number;
  grossPay: Prisma.Decimal | number;
  taxableIncome: Prisma.Decimal | number;
  payeTax: Prisma.Decimal | number;
  ssnitEmployee: Prisma.Decimal | number;
  ssnitEmployer: Prisma.Decimal | number;
  ghanaTier2PensionEmployer: Prisma.Decimal | number;
  kenyaShifEmployee: Prisma.Decimal | number;
  kenyaHousingLevyEmployee: Prisma.Decimal | number;
  kenyaHousingLevyEmployer: Prisma.Decimal | number;
  nigeriaNsitfEmployer: Prisma.Decimal | number;
  nigeriaNhisEmployee: Prisma.Decimal | number;
  nigeriaNhisEmployer: Prisma.Decimal | number;
  benefitsEmployeeDeduction: Prisma.Decimal | number;
  benefitsEmployerCost: Prisma.Decimal | number;
  unpaidLeaveDeduction: Prisma.Decimal | number;
  overtimePay: Prisma.Decimal | number;
  totalDeductions: Prisma.Decimal | number;
  netPay: Prisma.Decimal | number;
  currency: string;
  actorId?: string;
}

@Injectable()
export class PayslipRepository {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Recomputation is idempotent: while a PayRun is editable, calling this
   * again for the same (payRunId, employeeId) replaces the computed totals
   * without touching the payslip's line items (those are inputs to the
   * calculation, not outputs — see PayslipLineItemRepository).
   */
  upsert(tenantId: string, input: UpsertPayslipInput): Promise<Payslip> {
    return this.prisma.withTenantContext(tenantId, (tx) =>
      tx.payslip.upsert({
        where: {
          payRunId_employeeId: { payRunId: input.payRunId, employeeId: input.employeeId },
        },
        create: {
          tenantId,
          payRunId: input.payRunId,
          employeeId: input.employeeId,
          countryCode: input.countryCode,
          basicSalary: input.basicSalary,
          grossPay: input.grossPay,
          taxableIncome: input.taxableIncome,
          payeTax: input.payeTax,
          ssnitEmployee: input.ssnitEmployee,
          ssnitEmployer: input.ssnitEmployer,
          ghanaTier2PensionEmployer: input.ghanaTier2PensionEmployer,
          kenyaShifEmployee: input.kenyaShifEmployee,
          kenyaHousingLevyEmployee: input.kenyaHousingLevyEmployee,
          kenyaHousingLevyEmployer: input.kenyaHousingLevyEmployer,
          nigeriaNsitfEmployer: input.nigeriaNsitfEmployer,
          nigeriaNhisEmployee: input.nigeriaNhisEmployee,
          nigeriaNhisEmployer: input.nigeriaNhisEmployer,
          benefitsEmployeeDeduction: input.benefitsEmployeeDeduction,
          benefitsEmployerCost: input.benefitsEmployerCost,
          unpaidLeaveDeduction: input.unpaidLeaveDeduction,
          overtimePay: input.overtimePay,
          totalDeductions: input.totalDeductions,
          netPay: input.netPay,
          currency: input.currency,
          createdBy: input.actorId,
          updatedBy: input.actorId,
        },
        update: {
          countryCode: input.countryCode,
          basicSalary: input.basicSalary,
          grossPay: input.grossPay,
          taxableIncome: input.taxableIncome,
          payeTax: input.payeTax,
          ssnitEmployee: input.ssnitEmployee,
          ssnitEmployer: input.ssnitEmployer,
          ghanaTier2PensionEmployer: input.ghanaTier2PensionEmployer,
          kenyaShifEmployee: input.kenyaShifEmployee,
          kenyaHousingLevyEmployee: input.kenyaHousingLevyEmployee,
          kenyaHousingLevyEmployer: input.kenyaHousingLevyEmployer,
          nigeriaNsitfEmployer: input.nigeriaNsitfEmployer,
          nigeriaNhisEmployee: input.nigeriaNhisEmployee,
          nigeriaNhisEmployer: input.nigeriaNhisEmployer,
          benefitsEmployeeDeduction: input.benefitsEmployeeDeduction,
          benefitsEmployerCost: input.benefitsEmployerCost,
          unpaidLeaveDeduction: input.unpaidLeaveDeduction,
          overtimePay: input.overtimePay,
          totalDeductions: input.totalDeductions,
          netPay: input.netPay,
          currency: input.currency,
          updatedBy: input.actorId,
        },
      }),
    );
  }

  findById(tenantId: string, id: string): Promise<PayslipWithLineItems | null> {
    return this.prisma.withTenantContext(tenantId, (tx) =>
      tx.payslip.findFirst({
        where: { id, tenantId, deletedAt: null },
        include: { lineItems: true },
      }),
    );
  }

  findByPayRunAndEmployee(
    tenantId: string,
    payRunId: string,
    employeeId: string,
  ): Promise<PayslipWithLineItems | null> {
    return this.prisma.withTenantContext(tenantId, (tx) =>
      tx.payslip.findFirst({
        where: { tenantId, payRunId, employeeId, deletedAt: null },
        include: { lineItems: true },
      }),
    );
  }

  listByPayRun(tenantId: string, payRunId: string): Promise<PayslipWithLineItems[]> {
    return this.prisma.withTenantContext(tenantId, (tx) =>
      tx.payslip.findMany({
        where: { tenantId, payRunId, deletedAt: null },
        include: { lineItems: true },
        orderBy: { createdAt: 'asc' },
      }),
    );
  }

  listByEmployee(tenantId: string, employeeId: string): Promise<PayslipWithLineItems[]> {
    return this.prisma.withTenantContext(tenantId, (tx) =>
      tx.payslip.findMany({
        where: { tenantId, employeeId, deletedAt: null },
        include: { lineItems: true },
        orderBy: { createdAt: 'desc' },
      }),
    );
  }

  updateStatus(
    tenantId: string,
    id: string,
    status: PayslipStatus,
    updatedBy?: string,
  ): Promise<Payslip> {
    return this.prisma.withTenantContext(tenantId, (tx) =>
      tx.payslip.update({ where: { id }, data: { status, updatedBy } }),
    );
  }

  updateManyStatusByPayRun(
    tenantId: string,
    payRunId: string,
    status: PayslipStatus,
    updatedBy?: string,
  ): Promise<Prisma.BatchPayload> {
    return this.prisma.withTenantContext(tenantId, (tx) =>
      tx.payslip.updateMany({ where: { tenantId, payRunId }, data: { status, updatedBy } }),
    );
  }

  /**
   * Called by PayRunService.disburse just *before* it calls Paystack's
   * Initiate Transfer, not after - see that method's docstring for why.
   * reference is unique, used to match the later webhook.
   *
   * Conditional on disbursementStatus still being NOT_INITIATED/FAILED -
   * this is the actual lock against a duplicate Paystack transfer. Two
   * concurrent calls for the same payslip (a racing markPaid + retry, or
   * two overlapping markPaid requests) both pass their in-memory checks,
   * but only one updateMany here can win the conditional write; the loser
   * gets count 0 and must not call Paystack. Returns the claimed row on
   * success, null if the claim was lost.
   */
  async recordDisbursementInitiated(
    tenantId: string,
    id: string,
    input: { paystackRecipientCode: string; paystackTransferReference: string },
  ): Promise<Payslip | null> {
    return this.prisma.withTenantContext(tenantId, async (tx) => {
      const { count } = await tx.payslip.updateMany({
        where: {
          id,
          tenantId,
          disbursementStatus: {
            in: [PayslipDisbursementStatus.NOT_INITIATED, PayslipDisbursementStatus.FAILED],
          },
        },
        data: {
          disbursementStatus: PayslipDisbursementStatus.PENDING,
          paystackRecipientCode: input.paystackRecipientCode,
          paystackTransferReference: input.paystackTransferReference,
        },
      });
      if (count === 0) {
        return null;
      }
      return tx.payslip.findFirstOrThrow({ where: { id, tenantId } });
    });
  }

  /** Called by PayrollTransferWebhookListener once the transfer.success/transfer.failed webhook arrives. */
  recordDisbursementResult(
    tenantId: string,
    id: string,
    status: typeof PayslipDisbursementStatus.SUCCESS | typeof PayslipDisbursementStatus.FAILED,
  ): Promise<Payslip> {
    return this.prisma.withTenantContext(tenantId, (tx) =>
      tx.payslip.update({
        where: { id },
        data: { disbursementStatus: status, disbursedAt: new Date() },
      }),
    );
  }
}
