// Whole calendar days between an application and the candidate's hire —
// negative/same-instant inputs clamp to 0 rather than going negative,
// since a data inconsistency here should read as "same day", not corrupt
// an average.
export function calculateTimeToHireDays(appliedAt: Date, hiredAt: Date): number {
  const diffMs = hiredAt.getTime() - appliedAt.getTime();
  return Math.max(0, Math.round(diffMs / (1000 * 60 * 60 * 24)));
}

export interface TimeToHirePair {
  appliedAt: Date;
  hiredAt: Date;
}

export function calculateAverageTimeToHireDays(pairs: TimeToHirePair[]): number {
  if (pairs.length === 0) {
    return 0;
  }
  const total = pairs.reduce(
    (sum, pair) => sum + calculateTimeToHireDays(pair.appliedAt, pair.hiredAt),
    0,
  );
  return Math.round((total / pairs.length) * 100) / 100;
}
