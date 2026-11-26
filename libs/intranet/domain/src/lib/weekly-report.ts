/**
 * The questions used when a department has no WeeklyReportTemplate row of
 * its own - see WeeklyReportTemplateService.getForOrganizationUnit.
 */
export const DEFAULT_WEEKLY_REPORT_QUESTIONS: readonly string[] = [
  'What did you do this week?',
  'What problems did you face?',
  'What is your plan for next week?',
];

/**
 * Normalizes any date to Monday 00:00 UTC of its containing week - the
 * canonical "weekStart" every WeeklyReport is keyed by. Pure/UTC so the
 * same calendar date always maps to the same week regardless of the
 * caller's local timezone.
 */
export function getWeekStart(date: Date): Date {
  const utcDate = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
  const day = utcDate.getUTCDay(); // 0 = Sunday ... 6 = Saturday
  const diffToMonday = day === 0 ? 6 : day - 1;
  utcDate.setUTCDate(utcDate.getUTCDate() - diffToMonday);
  return utcDate;
}

/** The instant the week after weekStart begins - the reporting deadline. */
export function getWeekEnd(weekStart: Date): Date {
  const end = new Date(weekStart);
  end.setUTCDate(end.getUTCDate() + 7);
  return end;
}

/**
 * Whether a report counts as late: submitted after its week ended, or
 * still unsubmitted once the week has ended. Never stored - lateness
 * keeps changing meaning for the same row as "now" moves forward, so this
 * is always computed fresh at read time (see WeeklyReportService).
 */
export function isReportLate(weekStart: Date, submittedAt: Date | null, now: Date): boolean {
  const weekEnd = getWeekEnd(weekStart);
  if (submittedAt) {
    return submittedAt.getTime() > weekEnd.getTime();
  }
  return now.getTime() > weekEnd.getTime();
}
