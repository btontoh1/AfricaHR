export interface ChurnRates {
  /** Percent of the previous period's tenants that churned - 0 when there was nobody to churn from. */
  logoChurnRatePercent: number;
  /** Percent of the previous period's MRR that churned - 0 when there was no starting MRR. */
  revenueChurnRatePercent: number;
}

function roundPercent(value: number): number {
  return Math.round(value * 100) / 100;
}

export function computeChurnRates(
  previousTenantCount: number,
  churnedTenantCount: number,
  startingMrr: number,
  churnedMrr: number,
): ChurnRates {
  return {
    logoChurnRatePercent:
      previousTenantCount === 0 ? 0 : roundPercent((churnedTenantCount / previousTenantCount) * 100),
    revenueChurnRatePercent: startingMrr === 0 ? 0 : roundPercent((churnedMrr / startingMrr) * 100),
  };
}
