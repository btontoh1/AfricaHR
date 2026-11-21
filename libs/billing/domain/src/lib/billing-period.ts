/**
 * Plain string union mirroring Prisma's BillingInterval enum - domain code
 * doesn't depend on the generated Prisma client, same posture as every
 * other value type in this lib (e.g. RecurringRevenueEntry's own fields).
 */
export type BillingIntervalValue = 'MONTHLY' | 'ANNUAL';

/**
 * One calendar month forward for a MONTHLY subscription, or 12 for an
 * ANNUAL one - the standard per-seat billing cadence for this v1
 * (platform-admin-assigned subscriptions, no proration yet). Defaults to
 * MONTHLY so every call site that predates ANNUAL support keeps behaving
 * exactly as before.
 */
export function nextBillingPeriod(
  currentPeriodEnd: Date,
  interval: BillingIntervalValue = 'MONTHLY',
): { start: Date; end: Date } {
  const start = new Date(currentPeriodEnd);
  const end = new Date(currentPeriodEnd);
  end.setMonth(end.getMonth() + (interval === 'ANNUAL' ? 12 : 1));
  return { start, end };
}

/**
 * "Expiring soon" means the current period ends within the next
 * `withinDays` days and hasn't already lapsed - a subscription whose period
 * already ended is PAST_DUE territory, not "expiring", so it's excluded
 * here rather than double-counted in both dashboard widgets.
 */
export function isExpiringSoon(currentPeriodEnd: Date, now: Date, withinDays = 7): boolean {
  const msUntilExpiry = currentPeriodEnd.getTime() - now.getTime();
  if (msUntilExpiry < 0) {
    return false;
  }
  return msUntilExpiry <= withinDays * 24 * 60 * 60 * 1000;
}
