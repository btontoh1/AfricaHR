import { FinanceService } from './finance.service';
import { PayrollGlPostingListener } from './payroll-gl-posting.listener';

describe('PayrollGlPostingListener', () => {
  let listener: PayrollGlPostingListener;
  let finance: jest.Mocked<FinanceService>;

  beforeEach(() => {
    finance = { postPayrollDisbursement: jest.fn() } as unknown as jest.Mocked<FinanceService>;
    listener = new PayrollGlPostingListener(finance);
  });

  it('posts one entry per currency group in the event payload', async () => {
    await listener.handlePayRunDisbursed({
      tenantId: 'tenant-1',
      organizationId: 'org-1',
      payRunId: 'payrun-1',
      payDate: '2026-01-31',
      byCurrency: [
        { currency: 'GHS', totalGrossPay: 1000, totalEmployerOnlyCost: 130, totalNetPay: 850 },
        { currency: 'NGN', totalGrossPay: 40000, totalEmployerOnlyCost: 5000, totalNetPay: 33000 },
      ],
    });

    expect(finance.postPayrollDisbursement).toHaveBeenCalledTimes(2);
    expect(finance.postPayrollDisbursement).toHaveBeenCalledWith('tenant-1', {
      organizationId: 'org-1',
      payRunId: 'payrun-1',
      payDate: new Date('2026-01-31'),
      currency: 'GHS',
      totals: { totalGrossPay: 1000, totalEmployerOnlyCost: 130, totalNetPay: 850 },
    });
    expect(finance.postPayrollDisbursement).toHaveBeenCalledWith('tenant-1', {
      organizationId: 'org-1',
      payRunId: 'payrun-1',
      payDate: new Date('2026-01-31'),
      currency: 'NGN',
      totals: { totalGrossPay: 40000, totalEmployerOnlyCost: 5000, totalNetPay: 33000 },
    });
  });

  it('swallows a posting failure for one currency without blocking the others', async () => {
    finance.postPayrollDisbursement.mockRejectedValueOnce(new Error('db down')).mockResolvedValueOnce(undefined);

    await listener.handlePayRunDisbursed({
      tenantId: 'tenant-1',
      organizationId: 'org-1',
      payRunId: 'payrun-1',
      payDate: '2026-01-31',
      byCurrency: [
        { currency: 'GHS', totalGrossPay: 1000, totalEmployerOnlyCost: 130, totalNetPay: 850 },
        { currency: 'NGN', totalGrossPay: 40000, totalEmployerOnlyCost: 5000, totalNetPay: 33000 },
      ],
    });

    expect(finance.postPayrollDisbursement).toHaveBeenCalledTimes(2);
  });
});
