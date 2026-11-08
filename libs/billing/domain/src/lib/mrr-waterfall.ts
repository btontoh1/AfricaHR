import { roundCurrency } from './money';

export interface TenantCharge {
  tenantId: string;
  amount: number;
}

export interface MrrWaterfall {
  startingMrr: number;
  newMrr: number;
  expansionMrr: number;
  contractionMrr: number;
  churnedMrr: number;
  endingMrr: number;
  /** newMrr + expansionMrr - contractionMrr - churnedMrr - should equal endingMrr - startingMrr. */
  netNewMrr: number;
  startingTenantCount: number;
  newTenantCount: number;
  churnedTenantCount: number;
}

/**
 * Classic net-new MRR waterfall for one currency, comparing what each
 * tenant was charged in the previous period vs the current one. A tenant
 * absent from `previous` is New; absent from `current` is Churned; present
 * in both is Expansion (charge went up) or Contraction (went down) - never
 * both, and a tenant charged the same amount in both periods contributes to
 * neither. Callers are expected to pass charges already scoped to a single
 * currency (mrr-history.ts's aggregateChargesByTenantMonth output, filtered
 * to one currency/month) - this function doesn't group by currency itself.
 */
export function computeMrrWaterfall(previous: TenantCharge[], current: TenantCharge[]): MrrWaterfall {
  const previousByTenant = new Map(previous.map((charge) => [charge.tenantId, charge.amount]));
  const currentByTenant = new Map(current.map((charge) => [charge.tenantId, charge.amount]));

  let newMrr = 0;
  let expansionMrr = 0;
  let contractionMrr = 0;
  let churnedMrr = 0;
  let newTenantCount = 0;
  let churnedTenantCount = 0;

  for (const [tenantId, amount] of currentByTenant) {
    const previousAmount = previousByTenant.get(tenantId);
    if (previousAmount === undefined) {
      newMrr += amount;
      newTenantCount += 1;
    } else if (amount > previousAmount) {
      expansionMrr += amount - previousAmount;
    } else if (amount < previousAmount) {
      contractionMrr += previousAmount - amount;
    }
  }

  for (const [tenantId, amount] of previousByTenant) {
    if (!currentByTenant.has(tenantId)) {
      churnedMrr += amount;
      churnedTenantCount += 1;
    }
  }

  const startingMrr = roundCurrency(previous.reduce((sum, charge) => sum + charge.amount, 0));
  const endingMrr = roundCurrency(current.reduce((sum, charge) => sum + charge.amount, 0));
  const netNewMrr = roundCurrency(newMrr + expansionMrr - contractionMrr - churnedMrr);

  return {
    startingMrr,
    newMrr: roundCurrency(newMrr),
    expansionMrr: roundCurrency(expansionMrr),
    contractionMrr: roundCurrency(contractionMrr),
    churnedMrr: roundCurrency(churnedMrr),
    endingMrr,
    netNewMrr,
    startingTenantCount: previous.length,
    newTenantCount,
    churnedTenantCount,
  };
}
