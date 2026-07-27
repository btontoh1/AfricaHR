/**
 * Ghana's maximum monthly insurable earnings for SSNIT Tier 1 contributions
 * - GHS 69,000, effective 1 January 2026 per SSNIT's public notice (raised
 * from GHS 61,000 under National Pensions Act 2008 s.63(3)'s periodic
 * review). Earnings above this ceiling stop accruing SSNIT contributions;
 * they're still fully taxable under PAYE.
 */
const GHANA_MAX_INSURABLE_EARNINGS = 69_000;

export function applyGhanaInsurableEarningsCap(basicSalary: number): number {
  return Math.min(basicSalary, GHANA_MAX_INSURABLE_EARNINGS);
}
