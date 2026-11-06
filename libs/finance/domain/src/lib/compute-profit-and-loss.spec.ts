import { computeProfitAndLoss } from './compute-profit-and-loss';

describe('computeProfitAndLoss', () => {
  it('computes revenue minus expense from a mix of account-type lines, ignoring asset/liability lines', () => {
    const report = computeProfitAndLoss([
      { currency: 'GHS', accountType: 'REVENUE', debit: 0, credit: 5000 },
      { currency: 'GHS', accountType: 'EXPENSE', debit: 3000, credit: 0 },
      { currency: 'GHS', accountType: 'ASSET', debit: 5000, credit: 0 },
      { currency: 'GHS', accountType: 'LIABILITY', debit: 0, credit: 2000 },
    ]);
    expect(report).toEqual([{ currency: 'GHS', totalRevenue: 5000, totalExpense: 3000, netIncome: 2000 }]);
  });

  it('nets a revenue account credit against any debit on it (e.g. a credit-note reversal)', () => {
    const report = computeProfitAndLoss([
      { currency: 'GHS', accountType: 'REVENUE', debit: 0, credit: 1000 },
      { currency: 'GHS', accountType: 'REVENUE', debit: 200, credit: 0 },
    ]);
    expect(report[0].totalRevenue).toBe(800);
  });

  it('returns an empty array when there are no lines at all', () => {
    expect(computeProfitAndLoss([])).toEqual([]);
  });

  it('reports a net loss as a negative netIncome', () => {
    const report = computeProfitAndLoss([
      { currency: 'GHS', accountType: 'REVENUE', debit: 0, credit: 1000 },
      { currency: 'GHS', accountType: 'EXPENSE', debit: 1500, credit: 0 },
    ]);
    expect(report[0].netIncome).toBe(-500);
  });

  it('never blends currencies together - a multi-currency tenant gets one report per currency', () => {
    const report = computeProfitAndLoss([
      { currency: 'GHS', accountType: 'REVENUE', debit: 0, credit: 1000 },
      { currency: 'GHS', accountType: 'EXPENSE', debit: 400, credit: 0 },
      { currency: 'NGN', accountType: 'REVENUE', debit: 0, credit: 50000 },
      { currency: 'NGN', accountType: 'EXPENSE', debit: 20000, credit: 0 },
    ]);
    expect(report).toEqual([
      { currency: 'GHS', totalRevenue: 1000, totalExpense: 400, netIncome: 600 },
      { currency: 'NGN', totalRevenue: 50000, totalExpense: 20000, netIncome: 30000 },
    ]);
  });
});
