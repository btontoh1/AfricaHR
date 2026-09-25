import { roundCurrency } from './money';

/** Straight-line only in v1 - deliberately minimal, same posture as this
 * chart's one fixed account per source type. */
export function computeMonthlyDepreciation(cost: number, salvageValue: number, usefulLifeMonths: number): number {
  return roundCurrency((cost - salvageValue) / usefulLifeMonths);
}

/**
 * The amount to post for one period, given what's already been
 * depreciated - caps at the remaining depreciable base so accumulated
 * depreciation never overshoots (cost - salvageValue), which a plain
 * monthly figure could do on the final period through ordinary rounding.
 * Returns 0 once nothing remains (already fully depreciated).
 */
export function computeDepreciationForPeriod(
  cost: number,
  salvageValue: number,
  usefulLifeMonths: number,
  accumulatedDepreciation: number,
): number {
  const remaining = roundCurrency(cost - salvageValue - accumulatedDepreciation);
  if (remaining <= 0) {
    return 0;
  }
  const monthly = computeMonthlyDepreciation(cost, salvageValue, usefulLifeMonths);
  return Math.min(monthly, remaining);
}

export function isFullyDepreciated(cost: number, salvageValue: number, accumulatedDepreciation: number): boolean {
  return roundCurrency(cost - salvageValue - accumulatedDepreciation) <= 0;
}

/** Fixed assets don't take a day-of-month directly (unlike
 * GlRecurringJournalEntry) - it's derived from the acquisition date, capped
 * at 28 for the same reason computeFirstRunDate/computeNextRunDate require
 * it capped (so every month has that day). */
export function depreciationDayOfMonth(acquisitionDate: Date): number {
  return Math.min(acquisitionDate.getUTCDate(), 28);
}
