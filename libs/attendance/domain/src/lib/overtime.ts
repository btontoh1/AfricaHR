import { roundHours } from './hours';

/**
 * Overtime is whatever exceeds the tenant's AttendancePolicy threshold for
 * that day — the threshold itself is never hardcoded (see project memory),
 * so this function is correct for any policy value, not a fixed 8-hour day.
 */
export function computeOvertimeHours(hoursWorked: number, standardDailyHours: number): number {
  return roundHours(Math.max(0, hoursWorked - standardDailyHours));
}
