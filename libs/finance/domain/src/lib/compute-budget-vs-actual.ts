import { GlAccountType } from './default-chart-of-accounts';
import { roundCurrency } from './money';

export interface BudgetAmount {
  accountId: string;
  accountCode: string;
  accountName: string;
  accountType: GlAccountType;
  currency: string;
  budgetAmount: number;
}

export interface ActualLineAmount {
  accountId: string;
  accountType: GlAccountType;
  currency: string;
  debit: number;
  credit: number;
}

export interface BudgetVsActualRow {
  accountCode: string;
  accountName: string;
  budgetAmount: number;
  actualAmount: number;
  /** actualAmount - budgetAmount - positive means over budget. */
  varianceAmount: number;
  /** null when budgetAmount is 0 (division by zero has no meaningful percent). */
  variancePercent: number | null;
}

export interface BudgetVsActualByCurrency {
  currency: string;
  rows: BudgetVsActualRow[];
  totalBudget: number;
  totalActual: number;
  totalVariance: number;
}

/**
 * Revenue accounts grow on the credit side, everything else (expense in
 * practice - the only other type anyone actually budgets) is read as a net
 * debit figure - same sign convention as computeProfitAndLoss, so a
 * positive actualAmount always reads as "revenue earned" or "amount spent",
 * never a sign a budgeter has to mentally flip.
 */
function actualAmount(accountType: GlAccountType, debit: number, credit: number): number {
  if (accountType === 'REVENUE') {
    return credit - debit;
  }
  return debit - credit;
}

/**
 * Compares each budgeted account's amount to what actually posted against
 * it - only accounts that have a budget row appear (an account with
 * activity but no budget set isn't "over budget", it was simply never
 * budgeted, so it's silently absent rather than shown with a misleading
 * $0 budget). Grouped by currency, never blended - same reasoning as every
 * other finance-domain report function; a budget itself is set in one
 * currency (see GlBudget), so this never needs to convert between them.
 */
export function computeBudgetVsActual(
  budgets: readonly BudgetAmount[],
  actualLines: readonly ActualLineAmount[],
): BudgetVsActualByCurrency[] {
  const currencies = [...new Set(budgets.map((budget) => budget.currency))].sort();

  return currencies.map((currency) => {
    const currencyBudgets = budgets.filter((budget) => budget.currency === currency);

    const actualByAccount = new Map<string, number>();
    for (const line of actualLines) {
      if (line.currency !== currency) {
        continue;
      }
      const current = actualByAccount.get(line.accountId) ?? 0;
      actualByAccount.set(line.accountId, current + actualAmount(line.accountType, line.debit, line.credit));
    }

    const rows: BudgetVsActualRow[] = [...currencyBudgets]
      .sort((a, b) => a.accountCode.localeCompare(b.accountCode))
      .map((budget) => {
        const actual = roundCurrency(actualByAccount.get(budget.accountId) ?? 0);
        const variance = roundCurrency(actual - budget.budgetAmount);
        return {
          accountCode: budget.accountCode,
          accountName: budget.accountName,
          budgetAmount: budget.budgetAmount,
          actualAmount: actual,
          varianceAmount: variance,
          variancePercent: budget.budgetAmount !== 0 ? roundCurrency((variance / budget.budgetAmount) * 100) : null,
        };
      });

    return {
      currency,
      rows,
      totalBudget: roundCurrency(rows.reduce((sum, row) => sum + row.budgetAmount, 0)),
      totalActual: roundCurrency(rows.reduce((sum, row) => sum + row.actualAmount, 0)),
      totalVariance: roundCurrency(rows.reduce((sum, row) => sum + row.varianceAmount, 0)),
    };
  });
}
