import { Injectable } from '@nestjs/common';
import { PlatformBillingRepository } from '@africahr/billing-data-access';
import {
  aggregateChargesByTenantMonth,
  computeChurnRates,
  computeCohortRetention,
  computeMrrWaterfall,
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

export interface PlatformSaasMetrics {
  mrrHistory: MrrHistoryPointResult[];
  arr: ArrByCurrency[];
  waterfall: MrrWaterfallByCurrency[];
  churnRates: ChurnRatesByCurrency[];
  subscriptionFunnel: SubscriptionFunnelEntry[];
  averageRevenuePerTenant: AverageRevenuePerTenant[];
  cohortRetention: CohortRetentionRowResult[];
}

/**
 * Investor/board-style SaaS metrics for the platform admin dashboard, all
 * reconstructed from invoice history rather than a dedicated snapshot table
 * - see platform_list_invoices_for_analytics's migration comment for why
 * that's the only source available. A tenant with no invoices yet (still
 * trialing, never billed) simply doesn't appear in any of these - it isn't
 * "new" or "churned", it just hasn't entered the billed population.
 */
@Injectable()
export class PlatformSaasMetricsService {
  constructor(private readonly platformBilling: PlatformBillingRepository) {}

  async getSaasMetrics(): Promise<PlatformSaasMetrics> {
    const [invoices, subscriptions, tenantSignupDates] = await Promise.all([
      this.platformBilling.listInvoicesForAnalytics(),
      this.platformBilling.listAllSubscriptions(),
      this.platformBilling.listTenantSignupMonths(),
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

    const waterfall: MrrWaterfallByCurrency[] = [];
    const churnRates: ChurnRatesByCurrency[] = [];
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
      churnRates.push({
        currency,
        month: latestMonth,
        ...computeChurnRates(result.startingTenantCount, result.churnedTenantCount, result.startingMrr, result.churnedMrr),
      });
    }

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
    const averageRevenuePerTenant = Array.from(latestPointByCurrency.values()).map((point) => ({
      currency: point.currency,
      amount: point.tenantCount === 0 ? 0 : roundCurrency(point.mrr / point.tenantCount),
    }));

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

    return { mrrHistory, arr, waterfall, churnRates, subscriptionFunnel, averageRevenuePerTenant, cohortRetention };
  }
}
