import { summarizePayrollCosts } from './payroll-cost-summary';

describe('summarizePayrollCosts', () => {
  it('returns all-zero totals for an empty list', () => {
    expect(summarizePayrollCosts([])).toEqual({
      payslipCount: 0,
      totalGrossPay: 0,
      totalNetPay: 0,
      totalDeductions: 0,
      totalEmployerCost: 0,
    });
  });

  it('sums gross, net, deductions, and employer cost across payslips', () => {
    const result = summarizePayrollCosts([
      { grossPay: 3000, netPay: 2400, totalDeductions: 600, ssnitEmployer: 390 },
      { grossPay: 5000, netPay: 3900, totalDeductions: 1100, ssnitEmployer: 650 },
    ]);

    expect(result).toEqual({
      payslipCount: 2,
      totalGrossPay: 8000,
      totalNetPay: 6300,
      totalDeductions: 1700,
      totalEmployerCost: 9040,
    });
  });
});
