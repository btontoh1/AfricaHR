import { computeProfitAndLoss } from './compute-profit-and-loss';

describe('computeProfitAndLoss', () => {
  it('computes revenue minus expense from a mix of account-type lines, ignoring asset/liability lines', () => {
    const report = computeProfitAndLoss([
      { accountType: 'REVENUE', debit: 0, credit: 5000 },
      { accountType: 'EXPENSE', debit: 3000, credit: 0 },
      { accountType: 'ASSET', debit: 5000, credit: 0 },
      { accountType: 'LIABILITY', debit: 0, credit: 2000 },
    ]);
    expect(report).toEqual({ totalRevenue: 5000, totalExpense: 3000, netIncome: 2000 });
  });

  it('nets a revenue account credit against any debit on it (e.g. a credit-note reversal)', () => {
    const report = computeProfitAndLoss([
      { accountType: 'REVENUE', debit: 0, credit: 1000 },
      { accountType: 'REVENUE', debit: 200, credit: 0 },
    ]);
    expect(report.totalRevenue).toBe(800);
  });

  it('returns zeroes when there are no revenue/expense lines at all', () => {
    expect(computeProfitAndLoss([])).toEqual({ totalRevenue: 0, totalExpense: 0, netIncome: 0 });
  });

  it('reports a net loss as a negative netIncome', () => {
    const report = computeProfitAndLoss([
      { accountType: 'REVENUE', debit: 0, credit: 1000 },
      { accountType: 'EXPENSE', debit: 1500, credit: 0 },
    ]);
    expect(report.netIncome).toBe(-500);
  });
});
