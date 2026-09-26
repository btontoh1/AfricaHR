import {
  PlatformBillingRepository,
  PlatformOperatingCostRepository,
  type CrossTenantInvoiceForAnalytics,
  type CrossTenantSubscription,
} from '@africahr/billing-data-access';
import { PlatformSaasMetricsService } from './platform-saas-metrics.service';

function invoice(overrides: Partial<CrossTenantInvoiceForAnalytics>): CrossTenantInvoiceForAnalytics {
  return {
    tenantId: 'tenant-1',
    currency: 'GHS',
    amount: 100,
    periodStart: new Date('2026-01-01'),
    status: 'PAID',
    ...overrides,
  };
}

describe('PlatformSaasMetricsService', () => {
  let platformBilling: jest.Mocked<PlatformBillingRepository>;
  let operatingCosts: jest.Mocked<PlatformOperatingCostRepository>;
  let service: PlatformSaasMetricsService;

  beforeEach(() => {
    platformBilling = {
      listInvoicesForAnalytics: jest.fn(),
      listAllSubscriptions: jest.fn(),
      listTenantSignupMonths: jest.fn(),
    } as unknown as jest.Mocked<PlatformBillingRepository>;
    operatingCosts = { list: jest.fn().mockResolvedValue([]) } as unknown as jest.Mocked<PlatformOperatingCostRepository>;
    service = new PlatformSaasMetricsService(platformBilling, operatingCosts);
  });

  it('returns empty results when there are no invoices yet', async () => {
    platformBilling.listInvoicesForAnalytics.mockResolvedValue([]);
    platformBilling.listAllSubscriptions.mockResolvedValue([]);
    platformBilling.listTenantSignupMonths.mockResolvedValue(new Map());

    const result = await service.getSaasMetrics();

    expect(result.mrrHistory).toEqual([]);
    expect(result.arr).toEqual([]);
    expect(result.waterfall).toEqual([]);
    expect(result.churnRates).toEqual([]);
    expect(result.ruleOf40).toEqual([]);
    expect(result.averageRevenuePerTenant).toEqual([]);
    expect(result.cohortRetention).toEqual([]);
    expect(result.subscriptionFunnel).toEqual([
      { status: 'TRIALING', count: 0 },
      { status: 'ACTIVE', count: 0 },
      { status: 'PAST_DUE', count: 0 },
      { status: 'CANCELLED', count: 0 },
    ]);
  });

  it('excludes cancelled invoices from every metric', async () => {
    platformBilling.listInvoicesForAnalytics.mockResolvedValue([
      invoice({ tenantId: 't1', amount: 500, status: 'CANCELLED' }),
    ]);
    platformBilling.listAllSubscriptions.mockResolvedValue([]);
    platformBilling.listTenantSignupMonths.mockResolvedValue(new Map());

    const result = await service.getSaasMetrics();

    expect(result.mrrHistory).toEqual([]);
  });

  it('builds MRR history, ARR, and average revenue per tenant from a single month', async () => {
    platformBilling.listInvoicesForAnalytics.mockResolvedValue([
      invoice({ tenantId: 't1', amount: 100, periodStart: new Date('2026-01-05') }),
      invoice({ tenantId: 't2', amount: 200, periodStart: new Date('2026-01-20') }),
    ]);
    platformBilling.listAllSubscriptions.mockResolvedValue([]);
    platformBilling.listTenantSignupMonths.mockResolvedValue(new Map());

    const result = await service.getSaasMetrics();

    expect(result.mrrHistory).toEqual([{ month: '2026-01', currency: 'GHS', mrr: 300, tenantCount: 2 }]);
    expect(result.arr).toEqual([{ currency: 'GHS', arr: 3600 }]);
    expect(result.averageRevenuePerTenant).toEqual([{ currency: 'GHS', amount: 150 }]);
    // Only one month of history - nothing to compare against for a waterfall yet.
    expect(result.waterfall).toEqual([]);
    expect(result.churnRates).toEqual([]);
  });

  it('computes the waterfall and churn rates across two months', async () => {
    platformBilling.listInvoicesForAnalytics.mockResolvedValue([
      // Jan: stable + churning
      invoice({ tenantId: 'stable', amount: 100, periodStart: new Date('2026-01-01') }),
      invoice({ tenantId: 'churning', amount: 50, periodStart: new Date('2026-01-01') }),
      // Feb: stable + brand new tenant
      invoice({ tenantId: 'stable', amount: 100, periodStart: new Date('2026-02-01') }),
      invoice({ tenantId: 'newcomer', amount: 80, periodStart: new Date('2026-02-01') }),
    ]);
    platformBilling.listAllSubscriptions.mockResolvedValue([]);
    platformBilling.listTenantSignupMonths.mockResolvedValue(new Map());

    const result = await service.getSaasMetrics();

    expect(result.waterfall).toEqual([
      {
        currency: 'GHS',
        month: '2026-02',
        previousMonth: '2026-01',
        startingMrr: 150,
        newMrr: 80,
        expansionMrr: 0,
        contractionMrr: 0,
        churnedMrr: 50,
        endingMrr: 180,
        netNewMrr: 30,
        startingTenantCount: 2,
        newTenantCount: 1,
        churnedTenantCount: 1,
      },
    ]);
    expect(result.churnRates).toEqual([
      { currency: 'GHS', month: '2026-02', logoChurnRatePercent: 50, revenueChurnRatePercent: 33.33 },
    ]);
    // No operating cost was entered for 2026-02/GHS - Rule of 40 stays empty
    // rather than assuming a 0-cost, 100%-margin business.
    expect(result.ruleOf40).toEqual([]);
  });

  it('computes Rule of 40 once an operating cost exists for the latest month/currency', async () => {
    platformBilling.listInvoicesForAnalytics.mockResolvedValue([
      invoice({ tenantId: 'stable', amount: 100, currency: 'GHS', periodStart: new Date('2026-01-01') }),
      invoice({ tenantId: 'stable', amount: 150, currency: 'GHS', periodStart: new Date('2026-02-01') }),
    ]);
    platformBilling.listAllSubscriptions.mockResolvedValue([]);
    platformBilling.listTenantSignupMonths.mockResolvedValue(new Map());
    operatingCosts.list.mockResolvedValue([{ id: 'cost-1', month: '2026-02', currency: 'GHS', amount: 90, notes: null }]);

    const result = await service.getSaasMetrics();

    // startingMrr 100 -> endingMrr 150: 50% growth. Margin on 150 revenue,
    // 90 cost: (150-90)/150 = 40%. Score = 50 + 40 = 90.
    expect(result.ruleOf40).toEqual([
      {
        currency: 'GHS',
        month: '2026-02',
        previousMonth: '2026-01',
        revenue: 150,
        cost: 90,
        revenueGrowthRatePercent: 50,
        profitMarginPercent: 40,
        score: 90,
      },
    ]);
  });

  it('restricts cohort retention to tenants who were actually billed', async () => {
    platformBilling.listInvoicesForAnalytics.mockResolvedValue([
      invoice({ tenantId: 'billed', amount: 100, periodStart: new Date('2026-01-01') }),
    ]);
    platformBilling.listAllSubscriptions.mockResolvedValue([]);
    platformBilling.listTenantSignupMonths.mockResolvedValue(
      new Map([
        ['billed', new Date('2026-01-10')],
        ['never-billed', new Date('2026-01-10')],
      ]),
    );

    const result = await service.getSaasMetrics();

    expect(result.cohortRetention).toEqual([{ cohortMonth: '2026-01', cohortSize: 1, retentionByMonthsElapsed: [100] }]);
  });

  it('summarizes the subscription funnel from live subscription statuses', async () => {
    platformBilling.listInvoicesForAnalytics.mockResolvedValue([]);
    platformBilling.listAllSubscriptions.mockResolvedValue([
      { status: 'ACTIVE' } as CrossTenantSubscription,
      { status: 'TRIALING' } as CrossTenantSubscription,
    ]);
    platformBilling.listTenantSignupMonths.mockResolvedValue(new Map());

    const result = await service.getSaasMetrics();

    expect(result.subscriptionFunnel).toEqual([
      { status: 'TRIALING', count: 1 },
      { status: 'ACTIVE', count: 1 },
      { status: 'PAST_DUE', count: 0 },
      { status: 'CANCELLED', count: 0 },
    ]);
  });
});
