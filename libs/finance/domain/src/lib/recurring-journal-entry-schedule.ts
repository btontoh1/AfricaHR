/**
 * The first scheduled run on or after startDate - same month as startDate
 * if startDate's own day-of-month hasn't passed dayOfMonth yet, otherwise
 * the following month. dayOfMonth is always 1-28 (enforced by
 * CreateRecurringJournalEntryDto), so every month has that day - no
 * end-of-month clamping needed.
 */
export function computeFirstRunDate(startDate: Date, dayOfMonth: number): Date {
  const candidate = new Date(Date.UTC(startDate.getUTCFullYear(), startDate.getUTCMonth(), dayOfMonth));
  if (candidate.getTime() >= Date.UTC(startDate.getUTCFullYear(), startDate.getUTCMonth(), startDate.getUTCDate())) {
    return candidate;
  }
  return new Date(Date.UTC(startDate.getUTCFullYear(), startDate.getUTCMonth() + 1, dayOfMonth));
}

/**
 * Exactly one month after the run date just posted, same dayOfMonth. If a
 * template has fallen behind by more than one period (the process was down,
 * or it's brand new with a past startDate), this only ever advances one
 * period at a time - RecurringJournalEntryPoster's daily sweep picks it up
 * again the next day and keeps advancing until it catches up, one posting
 * per day, rather than posting every missed period in a single sweep.
 */
export function computeNextRunDate(previousRunDate: Date, dayOfMonth: number): Date {
  return new Date(Date.UTC(previousRunDate.getUTCFullYear(), previousRunDate.getUTCMonth() + 1, dayOfMonth));
}

/** True once advancing past runDate would land after endDate - the poster's
 * cue to deactivate the template instead of scheduling another run. */
export function isPastEndDate(runDate: Date, endDate: Date | null): boolean {
  if (!endDate) {
    return false;
  }
  return runDate.getTime() > endDate.getTime();
}
