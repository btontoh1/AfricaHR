/**
 * Every "YYYY-MM" month from start to end inclusive - used to build a
 * complete X-axis/cohort-column sequence even for months with zero
 * invoices, so a gap in billing doesn't silently skip a column.
 */
export function enumerateMonths(startMonth: string, endMonth: string): string[] {
  const [startYear, startMonthNumber] = startMonth.split('-').map(Number);
  const [endYear, endMonthNumber] = endMonth.split('-').map(Number);

  const months: string[] = [];
  let year = startYear;
  let month = startMonthNumber;
  while (year < endYear || (year === endYear && month <= endMonthNumber)) {
    months.push(`${year}-${String(month).padStart(2, '0')}`);
    month += 1;
    if (month > 12) {
      month = 1;
      year += 1;
    }
  }
  return months;
}
