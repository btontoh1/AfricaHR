import { roundCurrency } from './money';

/** Cost minus revenue for the month - positive means burning cash, zero or negative means profitable. */
export function computeNetBurn(revenue: number, cost: number): number {
  return roundCurrency(cost - revenue);
}

/**
 * Months of cash left at the current burn rate. Not burning cash (net burn
 * at or below zero) has no meaningful "runway" to run out of, so this
 * returns null rather than an infinite or negative number of months.
 */
export function computeRunwayMonths(cashBalance: number, netBurn: number): number | null {
  if (netBurn <= 0) {
    return null;
  }
  return Math.round((cashBalance / netBurn) * 10) / 10;
}

/**
 * Net burn divided by net-new MRR for the month - a SaaS capital-efficiency
 * ratio (roughly: how much cash it costs to add $1 of new recurring
 * revenue). Below 1 is considered excellent, above 2 concerning. Returns
 * null when net-new MRR isn't positive - the ratio isn't meaningful when
 * there's no growth to divide by. Profitable (net burn <= 0) and growing is
 * the best case, reported as a burn multiple of 0.
 */
export function computeBurnMultiple(netBurn: number, netNewMrr: number): number | null {
  if (netNewMrr <= 0) {
    return null;
  }
  if (netBurn <= 0) {
    return 0;
  }
  return Math.round((netBurn / netNewMrr) * 100) / 100;
}
