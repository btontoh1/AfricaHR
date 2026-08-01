/**
 * One calendar month forward from the current period's end - the standard
 * per-seat billing cadence for this v1 (platform-admin-assigned
 * subscriptions, no proration/annual-plan support yet).
 */
export function nextBillingPeriod(currentPeriodEnd: Date): { start: Date; end: Date } {
  const start = new Date(currentPeriodEnd);
  const end = new Date(currentPeriodEnd);
  end.setMonth(end.getMonth() + 1);
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
