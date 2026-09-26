import { roundCurrency } from './money';

export interface TenantPeriodCharge {
  tenantId: string;
  currency: string;
  amount: number;
  /** Billing period, truncated to month - "YYYY-MM". */
  month: string;
}

export interface TenantMonthCharge extends TenantPeriodCharge {
  /** True if two or more invoices for this tenant/month/currency were summed together. */
  invoiceCount: number;
}

export interface MrrHistoryPoint {
  month: string;
  currency: string;
  mrr: number;
  tenantCount: number;
}

/**
 * Collapses raw per-invoice charges to one row per tenant/month/currency,
 * summing amounts - a tenant is very rarely billed twice for the same
 * period (e.g. a reissued invoice), but this guards against double-counting
 * if it happens rather than assuming one invoice per tenant per month.
 * Exported (not just an internal step of summarizeMrrHistory) because the
 * MRR waterfall and cohort retention need this same per-tenant-per-month
 * shape, not just the aggregated totals.
 */
export function aggregateChargesByTenantMonth(charges: TenantPeriodCharge[]): TenantMonthCharge[] {
  const byKey = new Map<string, TenantMonthCharge>();
  for (const charge of charges) {
    const key = `${charge.month}::${charge.currency}::${charge.tenantId}`;
    const existing = byKey.get(key);
    if (existing) {
      existing.amount = roundCurrency(existing.amount + charge.amount);
      existing.invoiceCount += 1;
    } else {
      byKey.set(key, { ...charge, invoiceCount: 1 });
    }
  }
  return Array.from(byKey.values());
}

/**
 * Reconstructs MRR history from invoiced amounts rather than a separate
 * snapshot table - Subscription only ever holds current state (no history
 * of past status/price changes), so historical recurring revenue can only
 * come from what was actually billed each period. Grouped by currency,
 * never blended - same reasoning as summarizeMonthlyRecurringRevenue.
 * tenantCount counts distinct paying tenants that month, not invoice rows.
 */
export function summarizeMrrHistory(charges: TenantPeriodCharge[]): MrrHistoryPoint[] {
  const aggregated = aggregateChargesByTenantMonth(charges);

  const points = new Map<string, MrrHistoryPoint>();
  for (const charge of aggregated) {
    const key = `${charge.month}::${charge.currency}`;
    const point = points.get(key) ?? { month: charge.month, currency: charge.currency, mrr: 0, tenantCount: 0 };
    point.mrr = roundCurrency(point.mrr + charge.amount);
    point.tenantCount += 1;
    points.set(key, point);
  }

  return Array.from(points.values()).sort(
    (a, b) => a.month.localeCompare(b.month) || a.currency.localeCompare(b.currency),
  );
}
