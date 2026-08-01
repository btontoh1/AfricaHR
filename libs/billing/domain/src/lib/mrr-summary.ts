import { calculateInvoiceAmount } from './invoice-amount';

export interface RecurringRevenueEntry {
  currency: string;
  pricePerEmployee: number;
  employeeCount: number;
}

export interface RecurringRevenueByCurrency {
  currency: string;
  subscriptionCount: number;
  mrr: number;
}

/**
 * Grouped by currency, never blended into one total - same reasoning as
 * summarizePayrollCosts in reporting-domain. Currencies present are
 * returned in alphabetical order; no active subscriptions returns an
 * empty array.
 */
export function summarizeMonthlyRecurringRevenue(
  entries: RecurringRevenueEntry[],
): RecurringRevenueByCurrency[] {
  const byCurrency = new Map<string, RecurringRevenueByCurrency>();

  for (const entry of entries) {
    const summary = byCurrency.get(entry.currency) ?? {
      currency: entry.currency,
      subscriptionCount: 0,
      mrr: 0,
    };

    summary.subscriptionCount += 1;
    summary.mrr += calculateInvoiceAmount(entry.pricePerEmployee, entry.employeeCount);

    byCurrency.set(entry.currency, summary);
  }

  return Array.from(byCurrency.values()).sort((a, b) => a.currency.localeCompare(b.currency));
}
