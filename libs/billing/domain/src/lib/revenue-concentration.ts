import { roundCurrency } from './money';

function roundPercent(value: number): number {
  return Math.round(value * 100) / 100;
}

export interface NamedTenantCharge {
  tenantId: string;
  tenantName: string;
  amount: number;
}

export interface TenantRevenueShare extends NamedTenantCharge {
  sharePercent: number;
}

export interface RevenueConcentration {
  topTenants: TenantRevenueShare[];
  /** Combined share of the tenants above - a customer-concentration/whale-risk signal for investors. */
  topTenantsSharePercent: number;
}

/**
 * Which tenants make up the largest share of one currency/month's MRR - a
 * customer-concentration risk signal (a platform where 3 tenants are 80% of
 * revenue is far riskier than one spread evenly across 50).
 */
export function computeRevenueConcentration(charges: NamedTenantCharge[], topN = 5): RevenueConcentration {
  const total = charges.reduce((sum, charge) => sum + charge.amount, 0);
  const sorted = [...charges].sort((a, b) => b.amount - a.amount);
  const top = sorted.slice(0, topN);

  const topTenants = top.map((charge) => ({
    ...charge,
    amount: roundCurrency(charge.amount),
    sharePercent: total === 0 ? 0 : roundPercent((charge.amount / total) * 100),
  }));
  const topTenantsSharePercent =
    total === 0 ? 0 : roundPercent((top.reduce((sum, charge) => sum + charge.amount, 0) / total) * 100);

  return { topTenants, topTenantsSharePercent };
}
