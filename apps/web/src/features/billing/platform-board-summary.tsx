'use client';

import { Printer } from 'lucide-react';
import { usePlatformSaasMetrics } from './queries';
import { getApiErrorMessage } from '@/lib/api-error';
import { formatCurrency } from '@/lib/format-currency';
import { CardSkeleton } from '@/components/loading-state';
import { ErrorState } from '@/components/error-state';
import { PageHeader } from '@/components/page-header';
import { Button } from '@/components/ui/button';

function distinctCurrencies(currencies: string[]): string[] {
  return [...new Set(currencies)].sort();
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between gap-4 border-b border-border py-1.5 text-sm last:border-0">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium">{value}</span>
    </div>
  );
}

/**
 * A condensed, single-column, one-page-per-currency board summary of the
 * same SaaS analytics shown on the main dashboard - meant to be printed or
 * saved as a PDF for an investor/board update, not browsed interactively.
 */
export function PlatformBoardSummary() {
  const { data: metrics, isLoading, isError, error } = usePlatformSaasMetrics();

  if (isLoading) {
    return <CardSkeleton />;
  }

  if (isError || !metrics) {
    return <ErrorState message={getApiErrorMessage(error, 'Failed to load SaaS metrics')} />;
  }

  const currencies = distinctCurrencies(metrics.mrrHistory.map((point) => point.currency));
  const asOf = new Date().toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' });

  return (
    <div className="mx-auto max-w-2xl space-y-8 print:max-w-none">
      <PageHeader
        title="Board Summary"
        description={`ParotHR SaaS metrics as of ${asOf}`}
        action={
          <Button variant="outline" onClick={() => window.print()} className="print:hidden">
            <Printer className="size-4" />
            Print / Save as PDF
          </Button>
        }
      />

      {currencies.length === 0 && <p className="text-sm text-muted-foreground">No billed activity yet.</p>}

      {currencies.map((currency) => {
        const mrrPoint = [...metrics.mrrHistory].reverse().find((point) => point.currency === currency);
        const arr = metrics.arr.find((entry) => entry.currency === currency);
        const avgRevenue = metrics.averageRevenuePerTenant.find((entry) => entry.currency === currency);
        const waterfall = metrics.waterfall.find((entry) => entry.currency === currency);
        const churn = metrics.churnRates.find((entry) => entry.currency === currency);
        const retention = metrics.revenueRetention.find((entry) => entry.currency === currency);
        const ruleOf40 = metrics.ruleOf40.find((entry) => entry.currency === currency);
        const ltvToCac = metrics.ltvToCac.find((entry) => entry.currency === currency);
        const burn = metrics.burnAndRunway.find((entry) => entry.currency === currency);

        return (
          <section key={currency} className="space-y-6 break-inside-avoid">
            <h2 className="text-lg font-semibold">{currency}</h2>

            <div>
              <h3 className="mb-1 text-sm font-medium text-muted-foreground">Revenue</h3>
              {mrrPoint && <SummaryRow label="MRR" value={formatCurrency(mrrPoint.mrr, currency)} />}
              {arr && <SummaryRow label="ARR" value={formatCurrency(arr.arr, currency)} />}
              {avgRevenue && <SummaryRow label="Average revenue per tenant" value={formatCurrency(avgRevenue.amount, currency)} />}
              {mrrPoint && <SummaryRow label="Billed tenants" value={String(mrrPoint.tenantCount)} />}
            </div>

            {waterfall && (
              <div>
                <h3 className="mb-1 text-sm font-medium text-muted-foreground">
                  Net-new MRR ({waterfall.previousMonth} → {waterfall.month})
                </h3>
                <SummaryRow label="Starting MRR" value={formatCurrency(waterfall.startingMrr, currency)} />
                <SummaryRow label="New" value={formatCurrency(waterfall.newMrr, currency)} />
                <SummaryRow label="Expansion" value={formatCurrency(waterfall.expansionMrr, currency)} />
                <SummaryRow label="Contraction" value={`-${formatCurrency(waterfall.contractionMrr, currency)}`} />
                <SummaryRow label="Churned" value={`-${formatCurrency(waterfall.churnedMrr, currency)}`} />
                <SummaryRow label="Ending MRR" value={formatCurrency(waterfall.endingMrr, currency)} />
                <SummaryRow label="Net-new MRR" value={formatCurrency(waterfall.netNewMrr, currency)} />
              </div>
            )}

            {(churn || retention) && (
              <div>
                <h3 className="mb-1 text-sm font-medium text-muted-foreground">Retention</h3>
                {churn && <SummaryRow label="Logo churn" value={`${churn.logoChurnRatePercent}%`} />}
                {churn && <SummaryRow label="Revenue churn" value={`${churn.revenueChurnRatePercent}%`} />}
                {retention && <SummaryRow label="Net revenue retention" value={`${retention.netRevenueRetentionPercent}%`} />}
                {retention && <SummaryRow label="Gross revenue retention" value={`${retention.grossRevenueRetentionPercent}%`} />}
              </div>
            )}

            {ruleOf40 && (
              <div>
                <h3 className="mb-1 text-sm font-medium text-muted-foreground">Rule of 40</h3>
                <SummaryRow label="Growth rate" value={`${ruleOf40.revenueGrowthRatePercent}%`} />
                <SummaryRow label="Profit margin" value={`${ruleOf40.profitMarginPercent}%`} />
                <SummaryRow label="Score" value={String(ruleOf40.score)} />
              </div>
            )}

            {ltvToCac && (
              <div>
                <h3 className="mb-1 text-sm font-medium text-muted-foreground">LTV : CAC</h3>
                <SummaryRow label="LTV" value={formatCurrency(ltvToCac.ltv, currency)} />
                <SummaryRow label="CAC" value={formatCurrency(ltvToCac.cac, currency)} />
                <SummaryRow label="Ratio" value={`${ltvToCac.ratio}:1`} />
              </div>
            )}

            {burn && (
              <div>
                <h3 className="mb-1 text-sm font-medium text-muted-foreground">Burn &amp; runway</h3>
                <SummaryRow label="Net burn" value={formatCurrency(burn.netBurn, currency)} />
                <SummaryRow label="Cash balance" value={formatCurrency(burn.cashBalance, currency)} />
                <SummaryRow label="Runway" value={burn.runwayMonths === null ? 'Not burning' : `${burn.runwayMonths} months`} />
                <SummaryRow label="Burn multiple" value={burn.burnMultiple === null ? 'N/A' : `${burn.burnMultiple}x`} />
              </div>
            )}
          </section>
        );
      })}

      <div>
        <h3 className="mb-1 text-sm font-medium text-muted-foreground">Subscription funnel</h3>
        {metrics.subscriptionFunnel.map((entry) => (
          <SummaryRow key={entry.status} label={entry.status.replace('_', ' ')} value={String(entry.count)} />
        ))}
      </div>
    </div>
  );
}
