function roundPercent(value: number): number {
  return Math.round(value * 100) / 100;
}

/** Percent change from `previous` to `current` - 0 when there was nothing to grow from. */
export function computeGrowthRatePercent(previous: number, current: number): number {
  if (previous === 0) {
    return 0;
  }
  return roundPercent(((current - previous) / previous) * 100);
}

/** (revenue - cost) / revenue as a percent - 0 when there was no revenue to take a margin of. */
export function computeProfitMarginPercent(revenue: number, cost: number): number {
  if (revenue === 0) {
    return 0;
  }
  return roundPercent(((revenue - cost) / revenue) * 100);
}

/**
 * Growth rate + profit margin - the standard SaaS "Rule of 40" health
 * check: a score at or above 40 is considered healthy, trading off growth
 * against profitability rather than demanding both individually.
 */
export function computeRuleOf40Score(growthRatePercent: number, profitMarginPercent: number): number {
  return roundPercent(growthRatePercent + profitMarginPercent);
}
