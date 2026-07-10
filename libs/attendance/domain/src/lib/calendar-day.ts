/**
 * Truncates a Date to UTC midnight of its calendar day — the granularity
 * AttendanceRecord's (tenantId, employeeId, date) uniqueness is keyed on
 * (one record per employee per day; see project memory for the no-breaks/
 * one-shift-per-day scope cut).
 */
export function toCalendarDay(date: Date): Date {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
}
