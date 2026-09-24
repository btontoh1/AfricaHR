import { computeBalanceSheet } from './compute-balance-sheet';

describe('computeBalanceSheet', () => {
  it('nets asset/liability balances and derives equity as revenue minus expense', () => {
    const report = computeBalanceSheet([
      { currency: 'GHS', accountType: 'ASSET', debit: 5000, credit: 0 },
      { currency: 'GHS', accountType: 'ASSET', debit: 0, credit: 2000 },
      { currency: 'GHS', accountType: 'LIABILITY', debit: 0, credit: 1000 },
      { currency: 'GHS', accountType: 'REVENUE', debit: 0, credit: 5000 },
      { currency: 'GHS', accountType: 'EXPENSE', debit: 3000, credit: 0 },
    ]);
    expect(report).toEqual([
      { currency: 'GHS', totalAssets: 3000, totalLiabilities: 1000, totalEquity: 2000 },
    ]);
  });

  it('always balances: totalAssets equals totalLiabilities plus totalEquity', () => {
    // The cash leg of a payroll disbursement: Cash and Bank (asset) credited,
    // Payroll Expense (expense) debited by the same amount - a single
    // balanced journal entry.
    const report = computeBalanceSheet([
      { currency: 'GHS', accountType: 'ASSET', debit: 0, credit: 5000 },
      { currency: 'GHS', accountType: 'EXPENSE', debit: 5000, credit: 0 },
    ]);
    const [{ totalAssets, totalLiabilities, totalEquity }] = report;
    expect(totalAssets).toBe(totalLiabilities + totalEquity);
  });

  it('returns an empty array when there are no lines at all', () => {
    expect(computeBalanceSheet([])).toEqual([]);
  });

  it('never blends currencies together - a multi-currency tenant gets one balance sheet per currency', () => {
    const report = computeBalanceSheet([
      { currency: 'GHS', accountType: 'ASSET', debit: 1000, credit: 0 },
      { currency: 'NGN', accountType: 'ASSET', debit: 50000, credit: 0 },
    ]);
    expect(report).toEqual([
      { currency: 'GHS', totalAssets: 1000, totalLiabilities: 0, totalEquity: 0 },
      { currency: 'NGN', totalAssets: 50000, totalLiabilities: 0, totalEquity: 0 },
    ]);
  });
});
