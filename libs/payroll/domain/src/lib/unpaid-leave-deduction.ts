import { roundCurrency } from './money';
import { countWorkingDays } from './working-days';

/**
 * Pro-rates a deduction for unpaid leave taken within a pay period: a
 * daily rate (basicSalary divided by the number of working days in the
 * pay period) times however many unpaid days the employee took.
 * unpaidDays is expected to already be filtered to APPROVED leave
 * requests on an unpaid LeaveType falling entirely within
 * [periodStart, periodEnd] - this function only handles the rate
 * arithmetic, not eligibility (see PayrollLeaveRequestRepository).
 * Returns 0 when there are no unpaid days, or when the pay period has no
 * working days at all (shouldn't happen for a real pay run, but avoids
 * dividing by zero rather than producing NaN).
 */
export function computeUnpaidLeaveDeduction(
  basicSalary: number,
  unpaidDays: number,
  periodStart: Date,
  periodEnd: Date,
): number {
  if (unpaidDays <= 0) {
    return 0;
  }
  const workingDaysInPeriod = countWorkingDays(periodStart, periodEnd);
  if (workingDaysInPeriod === 0) {
    return 0;
  }
  const dailyRate = basicSalary / workingDaysInPeriod;
  return roundCurrency(dailyRate * unpaidDays);
}
