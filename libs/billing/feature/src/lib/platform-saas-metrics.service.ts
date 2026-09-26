import { Injectable } from '@nestjs/common';
import { PlatformBillingRepository, PlatformFinancialInputRepository, PlatformOperatingCostRepository } from '@africahr/billing-data-access';
import { PlatformFinancialInputType } from '@prisma/client';
import {
  aggregateChargesByTenantMonth,
  computeBurnMultiple,
  computeCac,
  computeChurnRates,
  computeCohortRetention,
  computeGrowthRatePercent,
  computeLtv,
  computeLtvToCacRatio,
  computeMrrWaterfall,
  computeNetBurn,
  computeProfitMarginPercent,
  computeRevenueRetention,
  computeRuleOf40Score,
  computeRunwayMonths,
  enumerateMonths,
  roundCurrency,
  summarizeMrrHistory,
  summarizeSubscriptionsByStatus,
  type MrrHistoryPoint,
  type MrrWaterfall,
  type TenantPeriodCharge,
} from '@africahr/billing-domain';

function toMonthKey(date: Date): string {
  return date.toISOString().slice(0, 7);
}

export type MrrHistoryPointResult = MrrHistoryPoint;

export interface ArrByCurrency {
  currency: string;
  arr: number;
}

export interface MrrWaterfallByCurrency extends MrrWaterfall {
  currency: string;
  month: string;
  previousMonth: string;
}

export interface ChurnRatesByCurrency {
  currency: string;
  month: string;
  logoChurnRatePercent: number;
  revenueChurnRatePercent: number;
}

export interface SubscriptionFunnelEntry {
  status: string;
  count: number;
}

export interface AverageRevenuePerTenant {
  currency: string;
  amount: number;
}

export interface CohortRetentionRowResult {
  cohortMonth: string;
  cohortSize: number;
  retentionByMonthsElapsed: number[];
}

export interface RuleOf40Entry {
  currency: string;
  month: string;
  previousMonth: string;
  revenue: number;
  cost: number;
  revenueGrowthRatePercent: number;
  profitMarginPercent: number;
  score: number;
}

export interface RevenueRetentionEntry {
  currency: string;
  month: string;
  previousMonth: string;
  netRevenueRetentionPercent: number;
  grossRevenueRetentionPercent: number;
}

export interface LtvToCacEntry {
  currency: string;
  month: string;
  ltv: number;
  cac: number;
  ratio: number;
}

export interface BurnAndRunwayEntry {
  currency: string;
  month: string;
  netBurn: number;
  cashBalance: number;
  runwayMonths: number | null;
  burnMultiple: number | null;
}

export interface PlatformSaasMetrics {
  mrrHistory: MrrHistoryPointResult[];
  arr: ArrByCurrency[];
  waterfall: MrrWaterfallByCurrency[];
  churnRates: ChurnRatesByCurrency[];
  revenueRetention: RevenueRetentionEntry[];
  ruleOf40: RuleOf40Entry[];
  ltvToCac: LtvToCacEntry[];
  burnAndRunway: BurnAndRunwayEntry[];
  subscriptionFunnel: SubscriptionFunnelEntry[];
  averageRevenuePerTenant: AverageRevenuePerTenant[];
  cohortRetention: CohortRetentionRowResult[];
}

/**
 * Investor/board-style SaaS metrics for the platform admin dashboard.
 * mrrHistory/arr/waterfall/churnRates/revenueRetention/subscriptionFunnel/
 * averageRevenuePerTenant/cohortRetention are all reconstructed from invoice
 * history - see platform_list_invoices_for_analytics's migration comment
 * for why that's the only source available. ruleOf40/ltvToCac/burnAndRunway
 * additionally need a hand-entered operating cost, acquisition cost, or
 * cash balance for the latest billed month/currency (see
 * PlatformOperatingCost/PlatformFinancialInput) and stay empty until one
 * exists. A tenant with no invoices yet (still trialing, never billed)
 * simply doesn't appear in any of these - it isn't "new" or "churned", it
 * just hasn't entered the billed population.
 */
@Injectable()
export class PlatformSaasMetricsService {
  constructor(
    private readonly platformBilling: PlatformBillingRepository,
    private readonly operatingCosts: PlatformOperatingCostRepository,
    private readonly financialInputs: PlatformFinancialInputRepository,
  ) {}

  async getSaasMetrics(): Promise<PlatformSaasMetrics> {
    const [invoices, subscriptions, tenantSignupDates, costEntries, acquisitionCostEntries, cashBalanceEntries] = await Promise.all([
      this.platformBilling.listInvoicesForAnalytics(),
      this.platformBilling.listAllSubscriptions(),
      this.platformBilling.listTenantSignupMonths(),
      this.operatingCosts.list(),
      this.financialInputs.list(PlatformFinancialInputType.ACQUISITION_COST),
      this.financialInputs.list(PlatformFinancialInputType.CASH_BALANCE),
    ]);

    // A cancelled invoice was voided, never actually charged - it shouldn't
    // count as billed activity for any of these metrics.
    const charges: TenantPeriodCharge[] = invoices
      .filter((invoice) => invoice.status !== 'CANCELLED')
      .map((invoice) => ({
        tenantId: invoice.tenantId,
        currency: invoice.currency,
        amount: invoice.amount,
        month: toMonthKey(invoice.periodStart),
      }));

    const aggregated = aggregateChargesByTenantMonth(charges);
    const mrrHistory = summarizeMrrHistory(charges);
    const currencies = [...new Set(aggregated.map((charge) => charge.currency))].sort();

    const costByMonthCurrency = new Map(costEntries.map((entry) => [`${entry.month}::${entry.currency}`, entry.amount]));
    const acquisitionCostByMonthCurrency = new Map(
      acquisitionCostEntries.map((entry) => [`${entry.month}::${entry.currency}`, entry.amount]),
    );
    const cashBalanceByMonthCurrency = new Map(
      cashBalanceEntries.map((entry) => [`${entry.month}::${entry.currency}`, entry.amount]),
    );

    // Latest month's point per currency - the natural basis for ARR and
    // average revenue per tenant (mrrHistory is sorted ascending by month).
    const latestPointByCurrency = new Map<string, MrrHistoryPoint>();
    for (const point of mrrHistory) {
      latestPointByCurrency.set(point.currency, point);
    }
    const arr = Array.from(latestPointByCurrency.values()).map((point) => ({
      currency: point.currency,
      arr: roundCurrency(point.mrr * 12),
    }));
    const averageRevenuePerTenantByCurrency = new Map(
      Array.from(latestPointByCurrency.entries()).map(([currency, point]) => [
        currency,
        point.tenantCount === 0 ? 0 : roundCurrency(point.mrr / point.tenantCount),
      ]),
    );
    const averageRevenuePerTenant = Array.from(averageRevenuePerTenantByCurrency.entries()).map(([currency, amount]) => ({
      currency,
      amount,
    }));

    const waterfall: MrrWaterfallByCurrency[] = [];
    const churnRates: ChurnRatesByCurrency[] = [];
    const revenueRetention: RevenueRetentionEntry[] = [];
    const ruleOf40: RuleOf40Entry[] = [];
    const ltvToCac: LtvToCacEntry[] = [];
    const burnAndRunway: BurnAndRunwayEntry[] = [];
    for (const currency of currencies) {
      const currencyPoints = mrrHistory.filter((point) => point.currency === currency);
      if (currencyPoints.length < 2) {
        // Only one month of history so far - nothing to compare against yet.
        continue;
      }
      const latestMonth = currencyPoints[currencyPoints.length - 1].month;
      const previousMonth = currencyPoints[currencyPoints.length - 2].month;
      const previousCharges = aggregated.filter(
        (charge) => charge.currency === currency && charge.month === previousMonth,
      );
      const currentCharges = aggregated.filter(
        (charge) => charge.currency === currency && charge.month === latestMonth,
      );
      const result = computeMrrWaterfall(previousCharges, currentCharges);
      waterfall.push({ currency, month: latestMonth, previousMonth, ...result });
      const churn = computeChurnRates(result.startingTenantCount, result.churnedTenantCount, result.startingMrr, result.churnedMrr);
      churnRates.push({ currency, month: latestMonth, ...churn });
      revenueRetention.push({ currency, month: latestMonth, previousMonth, ...computeRevenueRetention(result) });

      // Only shown once a cost was actually entered for this month/currency -
      // defaulting to 0 would silently claim a 100% profit margin.
      const cost = costByMonthCurrency.get(`${latestMonth}::${currency}`);
      if (cost !== undefined) {
        const revenueGrowthRatePercent = computeGrowthRatePercent(result.startingMrr, result.endingMrr);
        const profitMarginPercent = computeProfitMarginPercent(result.endingMrr, cost);
        ruleOf40.push({
          currency,
          month: latestMonth,
          previousMonth,
          revenue: result.endingMrr,
          cost,
          revenueGrowthRatePercent,
          profitMarginPercent,
          score: computeRuleOf40Score(revenueGrowthRatePercent, profitMarginPercent),
        });

        const cashBalance = cashBalanceByMonthCurrency.get(`${latestMonth}::${currency}`);
        if (cashBalance !== undefined) {
          const netBurn = computeNetBurn(result.endingMrr, cost);
          burnAndRunway.push({
            currency,
            month: latestMonth,
            netBurn,
            cashBalance,
            runwayMonths: computeRunwayMonths(cashBalance, netBurn),
            burnMultiple: computeBurnMultiple(netBurn, result.netNewMrr),
          });
        }
      }

      // Only shown once acquisition spend was actually entered for this
      // month/currency - defaulting to 0 would silently claim infinite CAC
      // efficiency.
      const acquisitionCost = acquisitionCostByMonthCurrency.get(`${latestMonth}::${currency}`);
      if (acquisitionCost !== undefined) {
        const ltv = computeLtv(averageRevenuePerTenantByCurrency.get(currency) ?? 0, churn.logoChurnRatePercent);
        const cac = computeCac(acquisitionCost, result.newTenantCount);
        ltvToCac.push({ currency, month: latestMonth, ltv, cac, ratio: computeLtvToCacRatio(ltv, cac) });
      }
    }

    const subscriptionFunnel = summarizeSubscriptionsByStatus(subscriptions);

    // Cohort retention: cohort by signup month, restricted to tenants who
    // were ever actually billed (a trial that never converted was never
    // "acquired" as a paying customer, so it has nothing to retain).
    const billedTenantIds = new Set(aggregated.map((charge) => charge.tenantId));
    const tenantCohortMonths = new Map<string, string>();
    for (const [tenantId, createdAt] of tenantSignupDates) {
      if (billedTenantIds.has(tenantId)) {
        tenantCohortMonths.set(tenantId, toMonthKey(createdAt));
      }
    }

    const activeTenantIdsByMonth = new Map<string, Set<string>>();
    for (const charge of aggregated) {
      const tenantIds = activeTenantIdsByMonth.get(charge.month) ?? new Set<string>();
      tenantIds.add(charge.tenantId);
      activeTenantIdsByMonth.set(charge.month, tenantIds);
    }

    let monthSequence: string[] = [];
    if (mrrHistory.length > 0) {
      const allMonths = mrrHistory.map((point) => point.month).sort();
      monthSequence = enumerateMonths(allMonths[0], allMonths[allMonths.length - 1]);
    }

    const cohortRetention = computeCohortRetention(tenantCohortMonths, activeTenantIdsByMonth, monthSequence);

    return {
      mrrHistory,
      arr,
      waterfall,
      churnRates,
      revenueRetention,
      ruleOf40,
      ltvToCac,
      burnAndRunway,
      subscriptionFunnel,
      averageRevenuePerTenant,
      cohortRetention,
    };
  }
}
