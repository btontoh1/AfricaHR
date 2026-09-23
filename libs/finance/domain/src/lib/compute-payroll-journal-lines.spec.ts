import { GlAccountCode } from './default-chart-of-accounts';
import { computePayrollJournalLines, PayRunPayrollTotals } from './compute-payroll-journal-lines';

function sumDebits(lines: ReturnType<typeof computePayrollJournalLines>): number {
  return lines.reduce((sum, line) => sum + line.debit, 0);
}

function sumCredits(lines: ReturnType<typeof computePayrollJournalLines>): number {
  return lines.reduce((sum, line) => sum + line.credit, 0);
}

describe('computePayrollJournalLines', () => {
  it('balances for a typical Ghana pay run (grossPay, employer Tier2, deductions all nonzero)', () => {
    const totals: PayRunPayrollTotals = {
      totalGrossPay: 15234.5,
      totalEmployerOnlyCost: 1904.31,
      totalNetPay: 11876.42,
    };
    const lines = computePayrollJournalLines(totals);
    expect(sumDebits(lines)).toBeCloseTo(sumCredits(lines), 2);
    expect(lines).toEqual(
      expect.arrayContaining([
        { accountCode: GlAccountCode.PAYROLL_EXPENSE, debit: 17138.81, credit: 0 },
        { accountCode: GlAccountCode.CASH_AND_BANK, debit: 0, credit: 11876.42 },
        { accountCode: GlAccountCode.PAYROLL_LIABILITIES_PAYABLE, debit: 0, credit: 5262.39 },
      ]),
    );
  });

  it('balances when there are no employer-only costs at all (e.g. a country with no extra statutory levies)', () => {
    const totals: PayRunPayrollTotals = {
      totalGrossPay: 5000,
      totalEmployerOnlyCost: 0,
      totalNetPay: 4000,
    };
    const lines = computePayrollJournalLines(totals);
    expect(sumDebits(lines)).toBeCloseTo(sumCredits(lines), 2);
    expect(lines.find((l) => l.accountCode === GlAccountCode.PAYROLL_EXPENSE)?.debit).toBe(5000);
    expect(lines.find((l) => l.accountCode === GlAccountCode.PAYROLL_LIABILITIES_PAYABLE)?.credit).toBe(1000);
  });

  it('omits the liabilities line entirely when there are no deductions or employer-only costs (net pay equals gross pay)', () => {
    const totals: PayRunPayrollTotals = {
      totalGrossPay: 3000,
      totalEmployerOnlyCost: 0,
      totalNetPay: 3000,
    };
    const lines = computePayrollJournalLines(totals);
    expect(lines.find((l) => l.accountCode === GlAccountCode.PAYROLL_LIABILITIES_PAYABLE)).toBeUndefined();
    expect(sumDebits(lines)).toBeCloseTo(sumCredits(lines), 2);
  });

  it('omits the cash line entirely if somehow every employee netted zero pay', () => {
    const totals: PayRunPayrollTotals = {
      totalGrossPay: 1000,
      totalEmployerOnlyCost: 100,
      totalNetPay: 0,
    };
    const lines = computePayrollJournalLines(totals);
    expect(lines.find((l) => l.accountCode === GlAccountCode.CASH_AND_BANK)).toBeUndefined();
    expect(sumDebits(lines)).toBeCloseTo(sumCredits(lines), 2);
  });

  it('always balances across a spread of realistic multi-country totals', () => {
    const scenarios: PayRunPayrollTotals[] = [
      { totalGrossPay: 100000, totalEmployerOnlyCost: 13000, totalNetPay: 78450.33 },
      { totalGrossPay: 42500.75, totalEmployerOnlyCost: 5312.6, totalNetPay: 33890.11 },
      { totalGrossPay: 1, totalEmployerOnlyCost: 0.05, totalNetPay: 0.8 },
      { totalGrossPay: 987654.32, totalEmployerOnlyCost: 123456.78, totalNetPay: 765432.1 },
    ];

    for (const totals of scenarios) {
      const lines = computePayrollJournalLines(totals);
      expect(sumDebits(lines)).toBeCloseTo(sumCredits(lines), 2);
    }
  });
});
