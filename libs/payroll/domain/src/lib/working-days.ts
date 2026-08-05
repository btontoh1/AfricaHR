/**
 * Counts weekdays (Mon-Fri) between two dates, inclusive of both ends.
 * Mirrors leave-domain's countWorkingDays exactly - duplicated, not
 * imported, since scope:payroll cannot depend on scope:leave (Nx module
 * boundary, see eslint.config.mjs), same reasoning benefit-contribution.ts
 * gives for duplicating BenefitContributionType from benefits-domain.
 * Shared within payroll-domain by unpaid-leave-deduction.ts and
 * overtime-pay.ts - both derive a per-pay-period daily rate from
 * basicSalary the same way.
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
