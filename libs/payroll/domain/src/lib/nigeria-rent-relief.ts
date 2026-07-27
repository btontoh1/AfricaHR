import { roundCurrency } from './money';

/**
 * Nigeria's Rent Relief Allowance (Nigeria Tax Act 2025, s.30(2)(a)(vi),
 * effective 1 January 2026): 20% of annual rent paid, capped at
 * NGN 500,000/yr - deducted from gross pay before pension and before the
 * PAYE bands apply. Replaces the pre-2026 Consolidated Relief Allowance,
 * which the Act repeals outright rather than amends.
 *
 * Unlike the old CRA (which applied uniformly to every taxpayer), this
 * relief is opt-in and evidence-based - real law only grants it to tenants
 * who can document their rent. This engine models that by simply requiring
 * the employee's annualRentPaid to be explicitly set; an employee with none
 * on file gets zero relief, the same outcome as not qualifying.
 */
const ANNUAL_RENT_RELIEF_CAP = 500_000;
const RENT_RELIEF_RATE = 0.2;

export function calculateNigeriaRentRelief(annualRentPaid: number): number {
  if (annualRentPaid <= 0) {
    return 0;
  }
  const annualRelief = Math.min(annualRentPaid * RENT_RELIEF_RATE, ANNUAL_RENT_RELIEF_CAP);
  return roundCurrency(annualRelief / 12);
}
