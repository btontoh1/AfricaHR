'use client';

import { AlertTriangle, TrendingDown, TrendingUp, Users } from 'lucide-react';
import { usePlatformSaasMetrics } from './queries';
import { CohortRetentionTable } from './cohort-retention-table';
import { getApiErrorMessage } from '@/lib/api-error';
import { formatCurrency } from '@/lib/format-currency';
import { CardSkeleton } from '@/components/loading-state';
import { ErrorState } from '@/components/error-state';
import { PageHeader } from '@/components/page-header';
import { StatCard } from '@/features/reporting/stat-card';
import { ReportLineChart } from '@/features/reporting/report-line-chart';
import { ReportBarChart } from '@/features/reporting/report-bar-chart';
import { CHART_COLORS } from '@/features/reporting/chart-colors';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

function distinctCurrencies(currencies: string[]): string[] {
  return [...new Set(currencies)].sort();
}

export function PlatformSaasMetrics() {
  const { data: metrics, isLoading, isError, error } = usePlatformSaasMetrics();

  if (isLoading) {
    return (
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <CardSkeleton key={i} />
        ))}
      </div>
    );
  }

  if (isError || !metrics) {
    return <ErrorState message={getApiErrorMessage(error, 'Failed to load SaaS metrics')} />;
  }

  const currencies = distinctCurrencies(metrics.mrrHistory.map((point) => point.currency));

  return (
    <div className="space-y-6">
      <PageHeader
        title="SaaS Analytics"
        description="MRR history, net-new movement, churn, and cohort retention - investor/board-style metrics for the platform."
      />

      {/*
        One section per currency for anything money-shaped, never blended -
        same "never blend currencies" convention as every finance report.
      */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">MRR &amp; ARR history</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {currencies.length === 0 && (
            <p className="text-sm text-muted-foreground">No billed activity yet - MRR history builds up as invoices are paid.</p>
          )}
          {currencies.map((currency) => {
            const points = metrics.mrrHistory.filter((point) => point.currency === currency);
            const arr = metrics.arr.find((entry) => entry.currency === currency);
            const avgRevenue = metrics.averageRevenuePerTenant.find((entry) => entry.currency === currency);
            return (
              <div key={currency} className="space-y-3">
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <h3 className="text-sm font-medium text-muted-foreground">{currency}</h3>
                  <div className="flex flex-wrap gap-4 text-sm">
                    {arr && (
                      <span>
                        <span className="text-muted-foreground">ARR </span>
                        <span className="font-medium">{formatCurrency(arr.arr, currency)}</span>
                      </span>
                    )}
                    {avgRevenue && (
                      <span>
                        <span className="text-muted-foreground">Avg revenue/tenant </span>
                        <span className="font-medium">{formatCurrency(avgRevenue.amount, currency)}</span>
                      </span>
                    )}
                  </div>
                </div>
                <ReportLineChart
                  data={points.map((point) => ({ month: point.month, mrr: point.mrr }))}
                  categoryKey="month"
                  series={[{ key: 'mrr', label: `MRR (${currency})`, color: CHART_COLORS[0] }]}
                  valueFormatter={(value) => formatCurrency(value, currency)}
                  height={240}
                />
              </div>
            );
          })}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Net-new MRR waterfall</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {metrics.waterfall.length === 0 && (
            <p className="text-sm text-muted-foreground">
              Needs at least two months of billing history to compare against.
            </p>
          )}
          {metrics.waterfall.map((waterfall) => (
            <div key={waterfall.currency} className="space-y-3">
              <h3 className="text-sm font-medium text-muted-foreground">
                {waterfall.currency} — {waterfall.previousMonth} to {waterfall.month}
              </h3>
              <ReportBarChart
                data={[
                  { label: 'Starting', value: waterfall.startingMrr },
                  { label: '+ New', value: waterfall.newMrr },
                  { label: '+ Expansion', value: waterfall.expansionMrr },
                  { label: '− Contraction', value: -waterfall.contractionMrr },
                  { label: '− Churned', value: -waterfall.churnedMrr },
                  { label: 'Ending', value: waterfall.endingMrr },
                ]}
                categoryKey="label"
                series={[{ key: 'value', label: waterfall.currency, color: CHART_COLORS[0] }]}
                valueFormatter={(value) => formatCurrency(value, waterfall.currency)}
                height={260}
              />
            </div>
          ))}
        </CardContent>
      </Card>

      {metrics.churnRates.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Churn</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {metrics.churnRates.map((churn) => (
              <StatCard
                key={`logo-${churn.currency}`}
                label={`Logo churn (${churn.currency})`}
                value={`${churn.logoChurnRatePercent}%`}
                icon={TrendingDown}
              />
            ))}
            {metrics.churnRates.map((churn) => (
              <StatCard
                key={`revenue-${churn.currency}`}
                label={`Revenue churn (${churn.currency})`}
                value={`${churn.revenueChurnRatePercent}%`}
                icon={AlertTriangle}
              />
            ))}
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Users className="size-4 text-muted-foreground" />
            Subscription funnel
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ReportBarChart
            data={metrics.subscriptionFunnel.map((entry) => ({
              status: entry.status.replace('_', ' '),
              count: entry.count,
            }))}
            categoryKey="status"
            series={[{ key: 'count', label: 'Tenants', color: CHART_COLORS[0] }]}
            height={260}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <TrendingUp className="size-4 text-muted-foreground" />
            Cohort retention by signup month
          </CardTitle>
        </CardHeader>
        <CardContent>
          <CohortRetentionTable cohortRetention={metrics.cohortRetention} />
        </CardContent>
      </Card>
    </div>
  );
}
