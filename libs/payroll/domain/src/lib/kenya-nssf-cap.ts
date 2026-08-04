/**
 * Kenya's NSSF Upper Earnings Limit (Year 4 rates, effective 1 February
 * 2026, per the NSSF Act 2013's phased-in schedule) - KES 108,000/month.
 * NSSF Tier I (6% on the first KES 9,000, the Lower Earnings Limit) plus
 * Tier II (6% on pay between the LEL and the UEL) combine to a flat 6%
 * on pensionable pay up to the UEL, same shape as Ghana's insurable
 * earnings cap - so it's modeled the same way here rather than as two
 * separate tiers. Earnings above the UEL are still fully taxable, just
 * no longer accrue NSSF.
 */
const KENYA_NSSF_UPPER_EARNINGS_LIMIT = 108_000;

export function applyKenyaPensionableEarningsCap(basicSalary: number): number {
  return Math.min(basicSalary, KENYA_NSSF_UPPER_EARNINGS_LIMIT);
}
