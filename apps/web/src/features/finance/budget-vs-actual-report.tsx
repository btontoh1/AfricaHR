'use client';

import { useState } from 'react';
import { Scale } from 'lucide-react';
import { useBudgetVsActualReport } from './queries';
import { OrganizationFilter, ALL_ORGANIZATIONS } from '@/features/reporting/organization-filter';
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
import { TableCard } from '@/components/table-card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

function currentYear(): number {
  return new Date().getFullYear();
}

export function BudgetVsActualReport({ tenantId }: { tenantId: string }) {
  const [organizationId, setOrganizationId] = useState(ALL_ORGANIZATIONS);
  const [fiscalYear, setFiscalYear] = useState(currentYear());
  const [view, setView] = useState<ReportView>('table');

  const { data: report, isLoading, isError, error } = useBudgetVsActualReport(tenantId, {
    organizationId: organizationId === ALL_ORGANIZATIONS ? undefined : organizationId,
    fiscalYear,
  });

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end gap-3">
        <OrganizationFilter tenantId={tenantId} value={organizationId} onChange={setOrganizationId} />
        <div>
          <Label htmlFor="budget-vs-actual-fiscal-year">Fiscal year</Label>
          <Input
            id="budget-vs-actual-fiscal-year"
            type="number"
            className="w-28"
            min={2000}
            max={2100}
            value={fiscalYear}
            onChange={(e) => setFiscalYear(Number(e.target.value) || currentYear())}
          />
        </div>
      </div>

      <p className="text-sm text-muted-foreground">
        Only accounts with a budget set for this year appear below - activity on an account that was
        never budgeted isn&apos;t "over budget," it just wasn&apos;t budgeted. Covers the full calendar
        year (Jan 1 - Dec 31), not a partial year to date.
      </p>

      {isLoading && <CardSkeleton />}

      {isError && <ErrorState message={getApiErrorMessage(error, 'Failed to load the budget vs actual report')} />}

      {report && report.byCurrency.length === 0 && (
        <EmptyState icon={Scale} title="No budgets set for this year" />
      )}

      {report && report.byCurrency.length > 0 && (
        <div className="space-y-6">
          {/* One table per currency, never blended - same reasoning as every other finance report. */}
          {report.byCurrency.map((byCurrency) => (
            <div key={byCurrency.currency} className="space-y-2">
              <h3 className="text-sm font-medium text-muted-foreground">{byCurrency.currency}</h3>
              <ReportViewTabs
                view={view}
                onViewChange={setView}
                table={
                  <TableCard>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Account</TableHead>
                          <TableHead className="text-right">Budget</TableHead>
                          <TableHead className="text-right">Actual</TableHead>
                          <TableHead className="text-right">Variance</TableHead>
                          <TableHead className="text-right">%</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {byCurrency.rows.map((row) => (
                          <TableRow key={row.accountCode}>
                            <TableCell>
                              <span className="font-mono text-muted-foreground">{row.accountCode}</span>{' '}
                              {row.accountName}
                            </TableCell>
                            <TableCell className="text-right">
                              {formatCurrency(row.budgetAmount, byCurrency.currency)}
                            </TableCell>
                            <TableCell className="text-right">
                              {formatCurrency(row.actualAmount, byCurrency.currency)}
                            </TableCell>
                            <TableCell
                              className={`text-right ${row.varianceAmount > 0 ? 'text-destructive' : 'text-muted-foreground'}`}
                            >
                              {row.varianceAmount > 0 ? '+' : ''}
                              {formatCurrency(row.varianceAmount, byCurrency.currency)}
                            </TableCell>
                            <TableCell
                              className={`text-right ${row.varianceAmount > 0 ? 'text-destructive' : 'text-muted-foreground'}`}
                            >
                              {row.variancePercent === null
                                ? '—'
                                : `${row.variancePercent > 0 ? '+' : ''}${row.variancePercent}%`}
                            </TableCell>
                          </TableRow>
                        ))}
                        <TableRow>
                          <TableCell className="font-medium">Total</TableCell>
                          <TableCell className="text-right font-medium">
                            {formatCurrency(byCurrency.totalBudget, byCurrency.currency)}
                          </TableCell>
                          <TableCell className="text-right font-medium">
                            {formatCurrency(byCurrency.totalActual, byCurrency.currency)}
                          </TableCell>
                          <TableCell className="text-right font-medium">
                            {byCurrency.totalVariance > 0 ? '+' : ''}
                            {formatCurrency(byCurrency.totalVariance, byCurrency.currency)}
                          </TableCell>
                          <TableCell />
                        </TableRow>
                      </TableBody>
                    </Table>
                  </TableCard>
                }
                chart={
                  <ReportBarChart
                    data={byCurrency.rows.map((row) => ({
                      name: `${row.accountCode} ${row.accountName}`,
                      budget: row.budgetAmount,
                      actual: row.actualAmount,
                    }))}
                    categoryKey="name"
                    series={[
                      { key: 'budget', label: 'Budget', color: CHART_COLORS[0] },
                      { key: 'actual', label: 'Actual', color: CHART_COLORS[1] },
                    ]}
                    layout="vertical"
                    height={Math.max(240, byCurrency.rows.length * 56)}
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
