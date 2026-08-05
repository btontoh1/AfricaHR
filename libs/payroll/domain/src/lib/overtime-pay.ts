import { roundCurrency } from './money';
import { countWorkingDays } from './working-days';

/**
 * Pays overtime hours worked within a pay period at the employee's implied
 * hourly rate (basicSalary divided by the pay period's working days times
 * the tenant's standard daily hours - there is no stored hourly-rate concept
 * anywhere in this codebase, so this is derived the same way
 * unpaid-leave-deduction.ts derives a daily rate) times the country's
 * overtime premium multiplier (e.g. 1.5 for time-and-a-half - see
 * OVERTIME_MULTIPLIER in the StatutoryRateCode enum, since the premium is a
 * statutory minimum that varies by country, not tenant business policy).
 * overtimeHours is expected to already be summed from AttendanceRecord rows
 * falling within [periodStart, periodEnd] - this function only handles the
 * rate arithmetic (see PayrollAttendanceRecordRepository). Returns 0 when
 * there are no overtime hours, or when the pay period has no working days,
 * or standardDailyHours is not positive (no AttendancePolicy configured for
 * the tenant) - all avoid dividing by zero rather than producing NaN.
 */
export function computeOvertimePay(
  basicSalary: number,
  overtimeHours: number,
  periodStart: Date,
  periodEnd: Date,
  standardDailyHours: number,
  overtimeMultiplier: number,
): number {
  if (overtimeHours <= 0 || standardDailyHours <= 0) {
    return 0;
  }
  const workingDaysInPeriod = countWorkingDays(periodStart, periodEnd);
  if (workingDaysInPeriod === 0) {
    return 0;
  }
  const hourlyRate = basicSalary / (workingDaysInPeriod * standardDailyHours);
  return roundCurrency(hourlyRate * overtimeMultiplier * overtimeHours);
}
