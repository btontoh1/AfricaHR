import { summarizePayrollCosts } from './payroll-cost-summary';

describe('summarizePayrollCosts', () => {
  it('returns an empty array for an empty list', () => {
    expect(summarizePayrollCosts([])).toEqual([]);
  });

  it('sums gross, net, deductions, and employer cost within a single currency', () => {
    const result = summarizePayrollCosts([
      { currency: 'GHS', grossPay: 3000, netPay: 2400, totalDeductions: 600, ssnitEmployer: 390 },
      { currency: 'GHS', grossPay: 5000, netPay: 3900, totalDeductions: 1100, ssnitEmployer: 650 },
    ]);

    expect(result).toEqual([
      {
        currency: 'GHS',
        payslipCount: 2,
        totalGrossPay: 8000,
        totalNetPay: 6300,
        totalDeductions: 1700,
        totalEmployerCost: 9040,
      },
    ]);
  });

  it('keeps different currencies in separate totals instead of blending them together', () => {
    const result = summarizePayrollCosts([
      { currency: 'GHS', grossPay: 3000, netPay: 2400, totalDeductions: 600, ssnitEmployer: 390 },
      { currency: 'NGN', grossPay: 100_000, netPay: 91_200, totalDeductions: 8800, ssnitEmployer: 10_000 },
      { currency: 'GHS', grossPay: 5000, netPay: 3900, totalDeductions: 1100, ssnitEmployer: 650 },
    ]);

    expect(result).toEqual([
      {
        currency: 'GHS',
        payslipCount: 2,
        totalGrossPay: 8000,
        totalNetPay: 6300,
        totalDeductions: 1700,
        totalEmployerCost: 9040,
      },
      {
        currency: 'NGN',
        payslipCount: 1,
        totalGrossPay: 100_000,
        totalNetPay: 91_200,
        totalDeductions: 8800,
        totalEmployerCost: 110_000,
      },
    ]);
  });

  it('orders currency groups alphabetically regardless of input order', () => {
    const result = summarizePayrollCosts([
      { currency: 'NGN', grossPay: 1, netPay: 1, totalDeductions: 0, ssnitEmployer: 0 },
      { currency: 'GHS', grossPay: 1, netPay: 1, totalDeductions: 0, ssnitEmployer: 0 },
    ]);

    expect(result.map((r) => r.currency)).toEqual(['GHS', 'NGN']);
  });
});
