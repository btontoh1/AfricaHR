import { roundCurrency } from './money';

/**
 * Nigeria's Consolidated Relief Allowance (Personal Income Tax Act, Sixth
 * Schedule): the higher of ₦200,000/yr or 1% of gross income, plus 20% of
 * gross income - deducted from gross pay before pension and before the
 * PAYE bands apply. The ₦200,000 floor is converted to a monthly figure
 * (÷12) for the same reason the seeded tax bands are: this engine computes
 * PAYE per pay run, not annually.
 */
const ANNUAL_RELIEF_FLOOR = 200_000;

export function calculateNigeriaConsolidatedReliefAllowance(grossPay: number): number {
  const monthlyFloor = ANNUAL_RELIEF_FLOOR / 12;
  const higherOf = Math.max(monthlyFloor, grossPay * 0.01);
  return roundCurrency(higherOf + grossPay * 0.2);
}
