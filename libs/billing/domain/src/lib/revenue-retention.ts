import type { MrrWaterfall } from './mrr-waterfall';

function roundPercent(value: number): number {
  return Math.round(value * 100) / 100;
}

export interface RevenueRetentionRates {
  /** (starting + expansion - contraction - churn) / starting - can exceed 100% when expansion outpaces churn. */
  netRevenueRetentionPercent: number;
  /** (starting - contraction - churn) / starting - never exceeds 100%, since new business isn't counted. */
  grossRevenueRetentionPercent: number;
}

/**
 * NRR/GRR for one currency, derived from the same net-new MRR waterfall used
 * for churn - neither figure counts New business, only what happened to the
 * cohort of tenants that were already paying at the start of the period.
 */
export function computeRevenueRetention(waterfall: MrrWaterfall): RevenueRetentionRates {
  if (waterfall.startingMrr === 0) {
    return { netRevenueRetentionPercent: 0, grossRevenueRetentionPercent: 0 };
  }
  const net =
    ((waterfall.startingMrr + waterfall.expansionMrr - waterfall.contractionMrr - waterfall.churnedMrr) /
      waterfall.startingMrr) *
    100;
  const gross = ((waterfall.startingMrr - waterfall.contractionMrr - waterfall.churnedMrr) / waterfall.startingMrr) * 100;
  return {
    netRevenueRetentionPercent: roundPercent(net),
    grossRevenueRetentionPercent: roundPercent(gross),
  };
}
