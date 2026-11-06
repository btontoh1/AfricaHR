import { computeTrialBalance } from './compute-trial-balance';

describe('computeTrialBalance', () => {
  it('nets each account to whichever side (debit or credit) it balances on', () => {
    const report = computeTrialBalance([
      { currency: 'GHS', accountCode: '1000', accountName: 'Cash and Bank', debit: 5000, credit: 2000 },
      { currency: 'GHS', accountCode: '4000', accountName: 'Revenue', debit: 0, credit: 3000 },
    ]);

    expect(report).toEqual([
      {
        currency: 'GHS',
        accounts: [
          { accountCode: '1000', accountName: 'Cash and Bank', debit: 3000, credit: 0 },
          { accountCode: '4000', accountName: 'Revenue', debit: 0, credit: 3000 },
        ],
        totalDebit: 3000,
        totalCredit: 3000,
      },
    ]);
  });

  it('sums every line for the same account before netting, regardless of how many lines it has', () => {
    const report = computeTrialBalance([
      { currency: 'GHS', accountCode: '1000', accountName: 'Cash and Bank', debit: 1000, credit: 0 },
      { currency: 'GHS', accountCode: '1000', accountName: 'Cash and Bank', debit: 500, credit: 0 },
      { currency: 'GHS', accountCode: '1000', accountName: 'Cash and Bank', debit: 0, credit: 200 },
    ]);

    expect(report[0].accounts).toEqual([
      { accountCode: '1000', accountName: 'Cash and Bank', debit: 1300, credit: 0 },
    ]);
  });

  it('always balances: totalDebit equals totalCredit', () => {
    const report = computeTrialBalance([
      { currency: 'GHS', accountCode: '1000', accountName: 'Cash and Bank', debit: 0, credit: 5000 },
      { currency: 'GHS', accountCode: '5000', accountName: 'Payroll Expense', debit: 5000, credit: 0 },
    ]);

    expect(report[0].totalDebit).toBe(report[0].totalCredit);
  });

  it('sorts accounts by code', () => {
    const report = computeTrialBalance([
      { currency: 'GHS', accountCode: '5000', accountName: 'Payroll Expense', debit: 100, credit: 0 },
      { currency: 'GHS', accountCode: '1000', accountName: 'Cash and Bank', debit: 0, credit: 100 },
    ]);

    expect(report[0].accounts.map((account) => account.accountCode)).toEqual(['1000', '5000']);
  });

  it('returns an empty array when there are no lines at all', () => {
    expect(computeTrialBalance([])).toEqual([]);
  });

  it('never blends currencies together - a multi-currency tenant gets one trial balance per currency', () => {
    const report = computeTrialBalance([
      { currency: 'GHS', accountCode: '1000', accountName: 'Cash and Bank', debit: 1000, credit: 0 },
      { currency: 'NGN', accountCode: '1000', accountName: 'Cash and Bank', debit: 50000, credit: 0 },
    ]);

    expect(report).toEqual([
      {
        currency: 'GHS',
        accounts: [{ accountCode: '1000', accountName: 'Cash and Bank', debit: 1000, credit: 0 }],
        totalDebit: 1000,
        totalCredit: 0,
      },
      {
        currency: 'NGN',
        accounts: [{ accountCode: '1000', accountName: 'Cash and Bank', debit: 50000, credit: 0 }],
        totalDebit: 50000,
        totalCredit: 0,
      },
    ]);
  });
});
