import { PrismaService } from '@africahr/platform-database';
import { PayrollCostReportRepository } from './payroll-cost-report.repository';

function decimal(value: number) {
  return { toNumber: () => value };
}

describe('PayrollCostReportRepository', () => {
  let repository: PayrollCostReportRepository;
  let tx: { payslip: { findMany: jest.Mock } };
  let prisma: { withTenantContext: jest.Mock };

  beforeEach(() => {
    tx = { payslip: { findMany: jest.fn() } };
    prisma = { withTenantContext: jest.fn((_tenantId, fn) => fn(tx)) };
    repository = new PayrollCostReportRepository(prisma as unknown as PrismaService);
  });

  it('converts Decimal payslip fields to plain numbers', async () => {
    tx.payslip.findMany.mockResolvedValue([
      {
        grossPay: decimal(3000),
        netPay: decimal(2400),
        totalDeductions: decimal(600),
        ssnitEmployer: decimal(390),
      },
    ]);

    const result = await repository.listPayslipCosts('tenant-1', {
      from: new Date('2026-01-01'),
      to: new Date('2026-01-31'),
    });

    expect(result).toEqual([{ grossPay: 3000, netPay: 2400, totalDeductions: 600, ssnitEmployer: 390 }]);
  });

  it('filters by organization and pay-run period', async () => {
    tx.payslip.findMany.mockResolvedValue([]);
    const from = new Date('2026-01-01');
    const to = new Date('2026-01-31');

    await repository.listPayslipCosts('tenant-1', { organizationId: 'org-1', from, to });

    expect(tx.payslip.findMany).toHaveBeenCalledWith({
      where: {
        tenantId: 'tenant-1',
        deletedAt: null,
        payRun: { organizationId: 'org-1', periodStart: { gte: from }, periodEnd: { lte: to } },
      },
      select: { grossPay: true, netPay: true, totalDeductions: true, ssnitEmployer: true },
    });
  });
});
