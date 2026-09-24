/**
 * "Closed through" a date locks that date itself too (inclusive) - closing
 * through the last day of a month should also block a same-day backdated
 * entry, not just earlier ones.
 */
export function isDateWithinClosedPeriod(date: Date, closedThrough: Date | null): boolean {
  if (!closedThrough) {
    return false;
  }
  return date.getTime() <= closedThrough.getTime();
}

/**
 * Period close only ever moves forward - there's no reopen in v1 (see
 * GlPeriodClose's own schema comment). Closing through the same date twice
 * is allowed (a no-op re-close), only moving it earlier is rejected.
 */
export function canExtendPeriodClose(current: Date | null, next: Date): boolean {
  if (!current) {
    return true;
  }
  return next.getTime() >= current.getTime();
}
