import { GlAccountType } from './default-chart-of-accounts';
import { roundCurrency } from './money';

export interface AccountLineAmount {
  currency: string;
  accountType: GlAccountType;
  debit: number;
  credit: number;
}

export interface ProfitAndLossByCurrency {
  currency: string;
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
 * Grouped by currency, never blended into one total - a tenant can run
 * payroll/invoicing in more than one currency (e.g. a multi-organization
 * tenant with a Ghana and a Nigeria member body), and summing GHS and NGN
 * together would be financially meaningless. Same reasoning as
 * reporting-domain's summarizePayrollCosts.
 *
 * This only reflects what's actually been posted - payroll disbursement and
 * customer invoicing today, nothing else (no manual expense categories
 * beyond whatever a MANUAL journal entry happens to hit). See
 * FinanceReportsService's own doc comment for that caveat surfaced to
 * callers.
 */
export function computeProfitAndLoss(lines: readonly AccountLineAmount[]): ProfitAndLossByCurrency[] {
  const currencies = [...new Set(lines.map((line) => line.currency))].sort();
  return currencies.map((currency) => {
    const currencyLines = lines.filter((line) => line.currency === currency);
    const totalRevenue = roundCurrency(
      currencyLines
        .filter((line) => line.accountType === 'REVENUE')
        .reduce((sum, line) => sum + (line.credit - line.debit), 0),
    );
    const totalExpense = roundCurrency(
      currencyLines
        .filter((line) => line.accountType === 'EXPENSE')
        .reduce((sum, line) => sum + (line.debit - line.credit), 0),
    );
    return { currency, totalRevenue, totalExpense, netIncome: roundCurrency(totalRevenue - totalExpense) };
  });
}
