/** Duplicated from payroll-domain's money.ts, not imported - scope:finance
 * cannot depend on scope:payroll (see eslint.config.mjs module boundaries),
 * same reasoning as payslip-calculator.ts's own duplication of
 * benefit-contribution.ts from benefits-domain. */
export function roundCurrency(value: number): number {
  return Math.round(value * 100) / 100;
}
