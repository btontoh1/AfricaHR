import { GlAccountType } from './default-chart-of-accounts';
import { roundCurrency } from './money';

export interface AccountLineAmount {
  accountType: GlAccountType;
  debit: number;
  credit: number;
}

export interface ProfitAndLossReport {
  totalRevenue: number;
  totalExpense: number;
  netIncome: number;
}

/**
 * Revenue accounts grow on the credit side, expense accounts on the debit
 * side - standard double-entry sign convention. Only REVENUE/EXPENSE lines
 * contribute; ASSET/LIABILITY lines (e.g. the cash/AR/payable legs of the
 * same journal entries) are ignored here, same as any real P&L.
 *
 * This only reflects what's actually been posted - payroll disbursement and
 * customer invoicing today, nothing else (no manual expense categories
 * beyond whatever a MANUAL journal entry happens to hit). See
 * FinanceReportsService's own doc comment for that caveat surfaced to
 * callers.
 */
export function computeProfitAndLoss(lines: readonly AccountLineAmount[]): ProfitAndLossReport {
  const totalRevenue = roundCurrency(
    lines
      .filter((line) => line.accountType === 'REVENUE')
      .reduce((sum, line) => sum + (line.credit - line.debit), 0),
  );
  const totalExpense = roundCurrency(
    lines
      .filter((line) => line.accountType === 'EXPENSE')
      .reduce((sum, line) => sum + (line.debit - line.credit), 0),
  );
  return {
    totalRevenue,
    totalExpense,
    netIncome: roundCurrency(totalRevenue - totalExpense),
  };
}
