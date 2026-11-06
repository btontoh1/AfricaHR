/**
 * Rounds to 2 decimal places - money isn't computed in fractions of a cent.
 * Mirrors finance-domain/payroll-domain/benefits-domain's own roundCurrency;
 * not shared across domains since each is independently owned per the
 * module-boundary convention.
 */
export function roundCurrency(value: number): number {
  return Math.round(value * 100) / 100;
}
