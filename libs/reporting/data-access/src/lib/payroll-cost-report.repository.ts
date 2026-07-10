import { Injectable } from '@nestjs/common';
import { PrismaService } from '@africahr/platform-database';
import { PayslipCostEntry } from '@africahr/reporting-domain';

export interface PayrollCostReportParams {
  organizationId?: string;
  from: Date;
  to: Date;
}

/**
 * Reads Payslip/PayRun fields payroll-cost reporting needs, via the shared
 * PrismaService directly (same cross-bounded-context read pattern as
 * HeadcountReportRepository). Prisma's Decimal fields are converted to
 * plain numbers here at the boundary, so the domain layer's
 * summarizePayrollCosts stays free of a Decimal dependency.
 */
@Injectable()
export class PayrollCostReportRepository {
  constructor(private readonly prisma: PrismaService) {}

  async listPayslipCosts(
    tenantId: string,
    params: PayrollCostReportParams,
  ): Promise<PayslipCostEntry[]> {
    const payslips = await this.prisma.withTenantContext(tenantId, (tx) =>
      tx.payslip.findMany({
        where: {
          tenantId,
          deletedAt: null,
          payRun: {
            organizationId: params.organizationId,
            periodStart: { gte: params.from },
            periodEnd: { lte: params.to },
          },
        },
        select: { grossPay: true, netPay: true, totalDeductions: true, ssnitEmployer: true },
      }),
    );

    return payslips.map((payslip) => ({
      grossPay: payslip.grossPay.toNumber(),
      netPay: payslip.netPay.toNumber(),
      totalDeductions: payslip.totalDeductions.toNumber(),
      ssnitEmployer: payslip.ssnitEmployer.toNumber(),
    }));
  }
}
