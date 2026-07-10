// Attendance hours are computed as plain `number` (same convention as
// payroll-domain's money.ts — Decimal<->number conversion happens at the
// repository boundary, not in domain logic). Rounded to 2dp so floating-
// point error doesn't compound.
export function roundHours(hours: number): number {
  return Math.round((hours + Number.EPSILON) * 100) / 100;
}

export function computeHoursWorked(clockIn: Date, clockOut: Date): number {
  if (clockOut <= clockIn) {
    throw new RangeError('clockOut must be after clockIn');
  }
  const hours = (clockOut.getTime() - clockIn.getTime()) / (1000 * 60 * 60);
  return roundHours(hours);
}
