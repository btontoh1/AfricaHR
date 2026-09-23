import { FinanceService } from './finance.service';
import { PayrollGlPostingListener } from './payroll-gl-posting.listener';

describe('PayrollGlPostingListener', () => {
  let listener: PayrollGlPostingListener;
  let finance: jest.Mocked<FinanceService>;

  beforeEach(() => {
    finance = { postPayrollDisbursement: jest.fn() } as unknown as jest.Mocked<FinanceService>;
    listener = new PayrollGlPostingListener(finance);
  });

  it('translates the event payload into a FinanceService call', async () => {
    await listener.handlePayRunDisbursed({
      tenantId: 'tenant-1',
      organizationId: 'org-1',
      payRunId: 'payrun-1',
      payDate: '2026-01-31',
      totalGrossPay: 1000,
      totalEmployerOnlyCost: 130,
      totalNetPay: 850,
    });

    expect(finance.postPayrollDisbursement).toHaveBeenCalledWith('tenant-1', {
      organizationId: 'org-1',
      payRunId: 'payrun-1',
      payDate: new Date('2026-01-31'),
      totals: { totalGrossPay: 1000, totalEmployerOnlyCost: 130, totalNetPay: 850 },
    });
  });

  it('swallows a posting failure rather than letting it propagate', async () => {
    finance.postPayrollDisbursement.mockRejectedValue(new Error('db down'));

    await expect(
      listener.handlePayRunDisbursed({
        tenantId: 'tenant-1',
        organizationId: 'org-1',
        payRunId: 'payrun-1',
        payDate: '2026-01-31',
        totalGrossPay: 1000,
        totalEmployerOnlyCost: 130,
        totalNetPay: 850,
      }),
    ).resolves.toBeUndefined();
  });
});
