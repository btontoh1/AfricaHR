import { roundCurrency } from './money';

export interface CashLineAmount {
  currency: string;
  debit: number;
  credit: number;
}

export interface CashFlowByCurrency {
  currency: string;
  /** Net change in Cash and Bank over the period - debits (cash in) minus
   * credits (cash out). Classified entirely as Operating for v1: there's no
   * AP, investing, or financing activity yet to split out into the other
   * standard cash-flow sections. */
  netCashChange: number;
}

/** Caller passes only the Cash and Bank account's own journal lines for the
 * period (see FinanceReportsService) - this function doesn't filter by
 * account itself, it just sums whatever it's given, grouped by currency so
 * a multi-currency tenant's cash movements are never blended together. */
export function computeCashFlow(cashAccountLines: readonly CashLineAmount[]): CashFlowByCurrency[] {
  const currencies = [...new Set(cashAccountLines.map((line) => line.currency))].sort();
  return currencies.map((currency) => ({
    currency,
    netCashChange: roundCurrency(
      cashAccountLines
        .filter((line) => line.currency === currency)
        .reduce((sum, line) => sum + (line.debit - line.credit), 0),
    ),
  }));
}
