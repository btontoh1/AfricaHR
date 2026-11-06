'use client';

import { useState } from 'react';
import { LineChart } from 'lucide-react';
import { getProfitAndLossPdfUrl, useProfitAndLossReport } from './queries';
import { ReportPdfButtons } from './report-pdf-buttons';
import { getDefaultDateRange } from '@/features/reporting/date-range';
import { OrganizationFilter, ALL_ORGANIZATIONS } from '@/features/reporting/organization-filter';
import { StatCard } from '@/features/reporting/stat-card';
import { ReportViewTabs, type ReportView } from '@/features/reporting/report-view-tabs';
import { ReportBarChart } from '@/features/reporting/report-bar-chart';
import { CHART_COLORS } from '@/features/reporting/chart-colors';
import { getApiErrorMessage } from '@/lib/api-error';
import { formatCurrency } from '@/lib/format-currency';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { CardSkeleton } from '@/components/loading-state';
import { ErrorState } from '@/components/error-state';
import { EmptyState } from '@/components/empty-state';

export function ProfitAndLossReport({ tenantId }: { tenantId: string }) {
  const [organizationId, setOrganizationId] = useState(ALL_ORGANIZATIONS);
  const [{ from, to }, setRange] = useState(getDefaultDateRange());
  const [view, setView] = useState<ReportView>('table');

  const { data: report, isLoading, isError, error } = useProfitAndLossReport(tenantId, {
    organizationId: organizationId === ALL_ORGANIZATIONS ? undefined : organizationId,
    from,
    to,
  });

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end gap-3">
        <OrganizationFilter tenantId={tenantId} value={organizationId} onChange={setOrganizationId} />
        <div>
          <Label htmlFor="pnl-from">From</Label>
          <Input
            id="pnl-from"
            type="date"
            value={from}
            onChange={(e) => setRange((prev) => ({ ...prev, from: e.target.value }))}
          />
        </div>
        <div>
          <Label htmlFor="pnl-to">To</Label>
          <Input
            id="pnl-to"
            type="date"
            value={to}
            onChange={(e) => setRange((prev) => ({ ...prev, to: e.target.value }))}
          />
        </div>
      </div>

      <p className="text-sm text-muted-foreground">
        Only reflects revenue and expense actually posted so far — payroll disbursement and customer
        invoicing, plus any manual journal entries recorded. Not a complete P&amp;L until other costs
        (rent, subscriptions, etc) are entered too.
      </p>

      <ReportPdfButtons
        organizationSelected={organizationId !== ALL_ORGANIZATIONS}
        viewUrl={getProfitAndLossPdfUrl(tenantId, { organizationId, from, to }, false)}
        downloadUrl={getProfitAndLossPdfUrl(tenantId, { organizationId, from, to }, true)}
      />

      {isLoading && <CardSkeleton />}

      {isError && <ErrorState message={getApiErrorMessage(error, 'Failed to load the profit and loss report')} />}

      {report && report.byCurrency.length === 0 && (
        <EmptyState icon={LineChart} title="No revenue or expense posted for this period" />
      )}

      {report && report.byCurrency.length > 0 && (
        <div className="space-y-6">
          {/*
            One card group per currency, never blended into a single total -
            a tenant can post payroll/invoicing activity in more than one
            currency (e.g. a multi-organization tenant with Ghana and
            Nigeria member bodies), and summing them together would be
            financially meaningless. See finance-domain's
            computeProfitAndLoss.
          */}
          {report.byCurrency.map((byCurrency) => (
            <div key={byCurrency.currency} className="space-y-2">
              <h3 className="text-sm font-medium text-muted-foreground">{byCurrency.currency}</h3>
              <ReportViewTabs
                view={view}
                onViewChange={setView}
                table={
                  <div className="grid gap-4 sm:grid-cols-3">
                    <StatCard
                      label="Revenue"
                      value={formatCurrency(byCurrency.totalRevenue, byCurrency.currency)}
                    />
                    <StatCard
                      label="Expense"
                      value={formatCurrency(byCurrency.totalExpense, byCurrency.currency)}
                    />
                    <StatCard
                      label="Net income"
                      value={formatCurrency(byCurrency.netIncome, byCurrency.currency)}
                    />
                  </div>
                }
                chart={
                  <ReportBarChart
                    data={[
                      { name: 'Revenue', value: Number(byCurrency.totalRevenue) },
                      { name: 'Expense', value: Number(byCurrency.totalExpense) },
                      { name: 'Net income', value: Number(byCurrency.netIncome) },
                    ]}
                    categoryKey="name"
                    series={[{ key: 'value', label: byCurrency.currency, color: CHART_COLORS[0] }]}
                    valueFormatter={(value) => formatCurrency(value, byCurrency.currency)}
                  />
                }
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
