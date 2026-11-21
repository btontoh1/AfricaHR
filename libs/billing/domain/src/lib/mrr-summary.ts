import { calculateInvoiceAmount } from './invoice-amount';
import { BillingIntervalValue } from './billing-period';

export interface RecurringRevenueEntry {
  currency: string;
  pricePerEmployee: number;
  employeeCount: number;
  flatFeeAmount?: number;
  includedEmployeeCount?: number;
  billingInterval?: BillingIntervalValue;
}

export interface RecurringRevenueByCurrency {
  currency: string;
  subscriptionCount: number;
  mrr: number;
}

const MONTHS_PER_YEAR = 12;

/**
 * Grouped by currency, never blended into one total - same reasoning as
 * summarizePayrollCosts in reporting-domain. Currencies present are
 * returned in alphabetical order; no active subscriptions returns an
 * empty array.
 *
 * An ANNUAL subscription's period amount is the full year's charge, not a
 * monthly one, so it's divided by 12 before summing - otherwise an
 * annual-plan tenant would appear to contribute 12x their real monthly
 * run rate to this platform-wide MRR figure. A MONTHLY (or unset,
 * defaulting to MONTHLY) subscription's period amount already is its
 * monthly charge, so it's summed as-is.
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

    const periodAmount = calculateInvoiceAmount(
      entry.pricePerEmployee,
      entry.employeeCount,
      entry.flatFeeAmount,
      entry.includedEmployeeCount,
    );
    const monthlyAmount = entry.billingInterval === 'ANNUAL' ? periodAmount / MONTHS_PER_YEAR : periodAmount;

    summary.subscriptionCount += 1;
    summary.mrr += monthlyAmount;

    byCurrency.set(entry.currency, summary);
  }

  return Array.from(byCurrency.values()).sort((a, b) => a.currency.localeCompare(b.currency));
}
