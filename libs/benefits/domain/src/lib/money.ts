// Benefit contribution amounts are computed as plain `number` (same
// convention as payroll-domain's money.ts — Decimal<->number conversion
// happens at the repository boundary, not in domain logic). Rounded to 2dp
// so floating-point error doesn't compound.
export function roundCurrency(amount: number): number {
  return Math.round((amount + Number.EPSILON) * 100) / 100;
}
