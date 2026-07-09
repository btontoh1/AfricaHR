/**
 * Counts weekdays (Mon-Fri) between two dates, inclusive of both ends.
 * No public holiday calendar in v1 (see project memory) — a genuine
 * working-day count for a specific country/organization would need to
 * subtract gazetted holidays, which is deferred.
 */
export function countWorkingDays(startDate: Date, endDate: Date): number {
  if (endDate < startDate) {
    throw new RangeError('endDate must not be before startDate');
  }

  let count = 0;
  const cursor = new Date(
    Date.UTC(startDate.getUTCFullYear(), startDate.getUTCMonth(), startDate.getUTCDate()),
  );
  const end = new Date(Date.UTC(endDate.getUTCFullYear(), endDate.getUTCMonth(), endDate.getUTCDate()));

  while (cursor <= end) {
    const day = cursor.getUTCDay();
    if (day !== 0 && day !== 6) {
      count += 1;
    }
    cursor.setUTCDate(cursor.getUTCDate() + 1);
  }

  return count;
}
