// Payroll amounts are computed as plain `number` (same convention as
// Employee.baseSalary elsewhere in this codebase — Decimal<->number
// conversion happens at the repository boundary, not in domain logic).
// Every intermediate result is rounded to the minor currency unit (2dp) so
// floating-point error doesn't compound across a multi-step calculation.
export function roundCurrency(amount: number): number {
  return Math.round((amount + Number.EPSILON) * 100) / 100;
}
