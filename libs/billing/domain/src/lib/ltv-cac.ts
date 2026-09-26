import { roundCurrency } from './money';

/**
 * Simplified LTV: average revenue per tenant divided by the monthly logo
 * churn rate (as a fraction), i.e. ARPU * average customer lifetime in
 * months. Returns 0 when there's no churn rate to estimate a lifetime from
 * (rather than dividing by zero / implying an infinite lifetime).
 */
export function computeLtv(averageRevenuePerTenant: number, logoChurnRatePercent: number): number {
  if (logoChurnRatePercent <= 0) {
    return 0;
  }
  return roundCurrency(averageRevenuePerTenant / (logoChurnRatePercent / 100));
}

/** Total acquisition spend divided by the number of tenants it acquired that month. */
export function computeCac(acquisitionCost: number, newTenantCount: number): number {
  if (newTenantCount === 0) {
    return 0;
  }
  return roundCurrency(acquisitionCost / newTenantCount);
}

/** LTV:CAC ratio - the common SaaS benchmark is 3:1 or better. 0 when CAC is unknown. */
export function computeLtvToCacRatio(ltv: number, cac: number): number {
  if (cac === 0) {
    return 0;
  }
  return Math.round((ltv / cac) * 100) / 100;
}
