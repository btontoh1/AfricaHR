import { computeBudgetVsActual } from './compute-budget-vs-actual';

describe('computeBudgetVsActual', () => {
  it('reads expense actuals as a net debit figure (positive = amount spent)', () => {
    const result = computeBudgetVsActual(
      [{ accountId: 'acc-1', accountCode: '5900', accountName: 'General Expense', accountType: 'EXPENSE', currency: 'GHS', budgetAmount: 1000 }],
      [{ accountId: 'acc-1', accountType: 'EXPENSE', currency: 'GHS', debit: 800, credit: 0 }],
    );

    expect(result).toEqual([
      {
        currency: 'GHS',
        rows: [
          {
            accountCode: '5900',
            accountName: 'General Expense',
            budgetAmount: 1000,
            actualAmount: 800,
            varianceAmount: -200,
            variancePercent: -20,
          },
        ],
        totalBudget: 1000,
        totalActual: 800,
        totalVariance: -200,
      },
    ]);
  });

  it('reads revenue actuals as a net credit figure', () => {
    const result = computeBudgetVsActual(
      [{ accountId: 'acc-1', accountCode: '4000', accountName: 'Revenue', accountType: 'REVENUE', currency: 'GHS', budgetAmount: 1000 }],
      [{ accountId: 'acc-1', accountType: 'REVENUE', currency: 'GHS', debit: 0, credit: 1200 }],
    );

    expect(result[0].rows[0]).toEqual({
      accountCode: '4000',
      accountName: 'Revenue',
      budgetAmount: 1000,
      actualAmount: 1200,
      varianceAmount: 200,
      variancePercent: 20,
    });
  });

  it('defaults actual to 0 when a budgeted account has no activity', () => {
    const result = computeBudgetVsActual(
      [{ accountId: 'acc-1', accountCode: '5900', accountName: 'General Expense', accountType: 'EXPENSE', currency: 'GHS', budgetAmount: 500 }],
      [],
    );

    expect(result[0].rows[0].actualAmount).toBe(0);
    expect(result[0].rows[0].varianceAmount).toBe(-500);
  });

  it('returns null variancePercent when the budget is 0, avoiding a division by zero', () => {
    const result = computeBudgetVsActual(
      [{ accountId: 'acc-1', accountCode: '5900', accountName: 'General Expense', accountType: 'EXPENSE', currency: 'GHS', budgetAmount: 0 }],
      [{ accountId: 'acc-1', accountType: 'EXPENSE', currency: 'GHS', debit: 300, credit: 0 }],
    );

    expect(result[0].rows[0].variancePercent).toBeNull();
  });

  it('excludes activity on an account that was never budgeted', () => {
    const result = computeBudgetVsActual(
      [{ accountId: 'acc-1', accountCode: '5900', accountName: 'General Expense', accountType: 'EXPENSE', currency: 'GHS', budgetAmount: 500 }],
      [
        { accountId: 'acc-1', accountType: 'EXPENSE', currency: 'GHS', debit: 300, credit: 0 },
        { accountId: 'acc-unbudgeted', accountType: 'EXPENSE', currency: 'GHS', debit: 5000, credit: 0 },
      ],
    );

    expect(result[0].rows).toHaveLength(1);
    expect(result[0].rows[0].accountCode).toBe('5900');
  });

  it('groups by currency, never blending budgets set in different currencies', () => {
    const result = computeBudgetVsActual(
      [
        { accountId: 'acc-1', accountCode: '5900', accountName: 'General Expense', accountType: 'EXPENSE', currency: 'GHS', budgetAmount: 1000 },
        { accountId: 'acc-2', accountCode: '5900', accountName: 'General Expense', accountType: 'EXPENSE', currency: 'NGN', budgetAmount: 50000 },
      ],
      [
        { accountId: 'acc-1', accountType: 'EXPENSE', currency: 'GHS', debit: 900, credit: 0 },
        { accountId: 'acc-2', accountType: 'EXPENSE', currency: 'NGN', debit: 40000, credit: 0 },
      ],
    );

    expect(result).toHaveLength(2);
    const ghs = result.find((byCurrency) => byCurrency.currency === 'GHS');
    const ngn = result.find((byCurrency) => byCurrency.currency === 'NGN');
    expect(ghs?.totalActual).toBe(900);
    expect(ngn?.totalActual).toBe(40000);
  });

  it('sums multiple accounts into the currency totals', () => {
    const result = computeBudgetVsActual(
      [
        { accountId: 'acc-1', accountCode: '5000', accountName: 'Payroll Expense', accountType: 'EXPENSE', currency: 'GHS', budgetAmount: 1000 },
        { accountId: 'acc-2', accountCode: '5900', accountName: 'General Expense', accountType: 'EXPENSE', currency: 'GHS', budgetAmount: 500 },
      ],
      [
        { accountId: 'acc-1', accountType: 'EXPENSE', currency: 'GHS', debit: 1000, credit: 0 },
        { accountId: 'acc-2', accountType: 'EXPENSE', currency: 'GHS', debit: 600, credit: 0 },
      ],
    );

    expect(result[0].totalBudget).toBe(1500);
    expect(result[0].totalActual).toBe(1600);
    expect(result[0].totalVariance).toBe(100);
  });
});
