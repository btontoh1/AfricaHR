export interface ProcurementSpendEntry {
  vendorId: string;
  vendorName: string;
  orderDate: Date;
  lineTotal: number;
}

export interface ProcurementSpendByVendorMonth {
  vendorId: string;
  vendorName: string;
  /** Calendar month the order was placed in, as YYYY-MM. */
  month: string;
  totalSpend: number;
  orderCount: number;
}

function monthKey(date: Date): string {
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, '0')}`;
}

/**
 * Grouped by (vendor, calendar month of the order date) - one purchase
 * order contributes exactly one order to orderCount and its full line
 * total to totalSpend. Sorted by month then vendor name, ascending. An
 * empty input returns an empty array rather than a zeroed row, since
 * there's no vendor/month to attach zero spend to.
 */
export function summarizeProcurementSpend(entries: ProcurementSpendEntry[]): ProcurementSpendByVendorMonth[] {
  const byKey = new Map<string, ProcurementSpendByVendorMonth>();

  for (const entry of entries) {
    const month = monthKey(entry.orderDate);
    const key = `${entry.vendorId}:${month}`;
    const summary = byKey.get(key) ?? {
      vendorId: entry.vendorId,
      vendorName: entry.vendorName,
      month,
      totalSpend: 0,
      orderCount: 0,
    };

    summary.totalSpend += entry.lineTotal;
    summary.orderCount += 1;

    byKey.set(key, summary);
  }

  return Array.from(byKey.values()).sort(
    (a, b) => a.month.localeCompare(b.month) || a.vendorName.localeCompare(b.vendorName),
  );
}
