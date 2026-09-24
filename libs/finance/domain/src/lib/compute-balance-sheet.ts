import { AccountLineAmount } from './compute-profit-and-loss';
import { roundCurrency } from './money';

export interface BalanceSheetByCurrency {
  currency: string;
  totalAssets: number;
  totalLiabilities: number;
  /** Retained earnings since inception (cumulative revenue minus cumulative
   * expense, as of the balance sheet date) - there is no dedicated Equity
   * account in the default chart of accounts, so this is the plug that
   * makes totalAssets == totalLiabilities + totalEquity hold, the same way
   * it does on any real balance sheet before owner contributions/draws are
   * tracked separately. */
  totalEquity: number;
}

/**
 * Unlike computeProfitAndLoss/computeCashFlow, which report a flow over a
 * period, a balance sheet is a snapshot as of a single date - so the caller
 * (FinanceReportsService) passes every line from account inception through
 * that date, not just a period's worth.
 *
 * Asset accounts are debit-normal, liability accounts credit-normal -
 * standard double-entry sign convention. Because every journal entry this
 * system posts is balanced (debits == credits, enforced by
 * validate-balanced-entry.ts), totalAssets - totalLiabilities -
 * totalEquity is mathematically guaranteed to be zero; nothing here
 * enforces that separately.
 */
export function computeBalanceSheet(lines: readonly AccountLineAmount[]): BalanceSheetByCurrency[] {
  const currencies = [...new Set(lines.map((line) => line.currency))].sort();
  return currencies.map((currency) => {
    const currencyLines = lines.filter((line) => line.currency === currency);
    const totalAssets = roundCurrency(
      currencyLines
        .filter((line) => line.accountType === 'ASSET')
        .reduce((sum, line) => sum + (line.debit - line.credit), 0),
    );
    const totalLiabilities = roundCurrency(
      currencyLines
        .filter((line) => line.accountType === 'LIABILITY')
        .reduce((sum, line) => sum + (line.credit - line.debit), 0),
    );
    const totalRevenue = currencyLines
      .filter((line) => line.accountType === 'REVENUE')
      .reduce((sum, line) => sum + (line.credit - line.debit), 0);
    const totalExpense = currencyLines
      .filter((line) => line.accountType === 'EXPENSE')
      .reduce((sum, line) => sum + (line.debit - line.credit), 0);
    return {
      currency,
      totalAssets,
      totalLiabilities,
      totalEquity: roundCurrency(totalRevenue - totalExpense),
    };
  });
}
