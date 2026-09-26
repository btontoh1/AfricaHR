'use client';

import { useState } from 'react';
import { Banknote } from 'lucide-react';
import { usePayrollCostReport } from './queries';
import { getDefaultDateRange } from './date-range';
import { OrganizationFilter, ALL_ORGANIZATIONS } from './organization-filter';
import { StatCard } from './stat-card';
import { ReportViewTabs, type ReportView } from './report-view-tabs';
import { ReportBarChart } from './report-bar-chart';
import { CHART_COLORS } from './chart-colors';
import { getApiErrorMessage } from '@/lib/api-error';
import { formatCurrency } from '@/lib/format-currency';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { CardSkeleton } from '@/components/loading-state';
import { ErrorState } from '@/components/error-state';
import { EmptyState } from '@/components/empty-state';

export function PayrollCostReport({ tenantId }: { tenantId: string }) {
  const [organizationId, setOrganizationId] = useState(ALL_ORGANIZATIONS);
  const [{ from, to }, setRange] = useState(getDefaultDateRange());
  const [view, setView] = useState<ReportView>('table');

  const { data: report, isLoading, isError, error } = usePayrollCostReport(tenantId, {
    organizationId: organizationId === ALL_ORGANIZATIONS ? undefined : organizationId,
    from,
    to,
  });

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end gap-3">
        <OrganizationFilter tenantId={tenantId} value={organizationId} onChange={setOrganizationId} />
        <div>
          <Label htmlFor="payroll-cost-from">From</Label>
          <Input
            id="payroll-cost-from"
            type="date"
            value={from}
            onChange={(e) => setRange((prev) => ({ ...prev, from: e.target.value }))}
          />
        </div>
        <div>
          <Label htmlFor="payroll-cost-to">To</Label>
          <Input
            id="payroll-cost-to"
            type="date"
            value={to}
            onChange={(e) => setRange((prev) => ({ ...prev, to: e.target.value }))}
          />
        </div>
      </div>

      {isLoading && <CardSkeleton />}

      {isError && <ErrorState message={getApiErrorMessage(error, 'Failed to load the payroll cost report')} />}

      {report && report.length === 0 && (
        <EmptyState icon={Banknote} title="No payroll costs for this filter" />
      )}

      {report && report.length > 0 && (
        <div className="space-y-6">
          {/*
            One card group per currency, never blended into a single total -
            a tenant can run payroll in more than one currency (e.g. GHS and
            NGN employees), and summing them together would be financially
            meaningless. See summarizePayrollCosts in reporting-domain.
          */}
          {report.map((byCurrency) => (
            <div key={byCurrency.currency} className="space-y-2">
              <h3 className="text-sm font-medium text-muted-foreground">{byCurrency.currency}</h3>
              <div className="max-w-xs">
                <StatCard label="Payslips" value={byCurrency.payslipCount} />
              </div>
              <ReportViewTabs
                view={view}
                onViewChange={setView}
                table={
                  <div className="grid gap-4 sm:grid-cols-3">
                    <StatCard
                      label="Gross pay"
                      value={formatCurrency(byCurrency.totalGrossPay, byCurrency.currency)}
                    />
                    <StatCard
                      label="Net pay"
                      value={formatCurrency(byCurrency.totalNetPay, byCurrency.currency)}
                    />
                    <StatCard
                      label="Total deductions"
                      value={formatCurrency(byCurrency.totalDeductions, byCurrency.currency)}
                    />
                    <StatCard
                      label="Employer cost"
                      value={formatCurrency(byCurrency.totalEmployerCost, byCurrency.currency)}
                    />
                  </div>
                }
                chart={
                  <ReportBarChart
                    data={[
                      { name: 'Gross pay', value: Number(byCurrency.totalGrossPay) },
                      { name: 'Net pay', value: Number(byCurrency.totalNetPay) },
                      { name: 'Deductions', value: Number(byCurrency.totalDeductions) },
                      { name: 'Employer cost', value: Number(byCurrency.totalEmployerCost) },
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
