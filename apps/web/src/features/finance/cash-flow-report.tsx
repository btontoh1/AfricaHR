'use client';

import { useState } from 'react';
import { Coins } from 'lucide-react';
import { getCashFlowPdfUrl, useCashFlowReport } from './queries';
import { ReportPdfButtons } from './report-pdf-buttons';
import { getDefaultDateRange } from '@/features/reporting/date-range';
import { OrganizationFilter, ALL_ORGANIZATIONS } from '@/features/reporting/organization-filter';
import { StatCard } from '@/features/reporting/stat-card';
import { getApiErrorMessage } from '@/lib/api-error';
import { formatCurrency } from '@/lib/format-currency';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { CardSkeleton } from '@/components/loading-state';
import { ErrorState } from '@/components/error-state';
import { EmptyState } from '@/components/empty-state';

export function CashFlowReport({ tenantId }: { tenantId: string }) {
  const [organizationId, setOrganizationId] = useState(ALL_ORGANIZATIONS);
  const [{ from, to }, setRange] = useState(getDefaultDateRange());

  const { data: report, isLoading, isError, error } = useCashFlowReport(tenantId, {
    organizationId: organizationId === ALL_ORGANIZATIONS ? undefined : organizationId,
    from,
    to,
  });

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end gap-3">
        <OrganizationFilter tenantId={tenantId} value={organizationId} onChange={setOrganizationId} />
        <div>
          <Label htmlFor="cash-flow-from">From</Label>
          <Input
            id="cash-flow-from"
            type="date"
            value={from}
            onChange={(e) => setRange((prev) => ({ ...prev, from: e.target.value }))}
          />
        </div>
        <div>
          <Label htmlFor="cash-flow-to">To</Label>
          <Input
            id="cash-flow-to"
            type="date"
            value={to}
            onChange={(e) => setRange((prev) => ({ ...prev, to: e.target.value }))}
          />
        </div>
      </div>

      <p className="text-sm text-muted-foreground">
        Net change in cash over the period, classified entirely as Operating — there&apos;s no
        accounts-payable, investing, or financing activity yet to split out into the other standard
        cash-flow sections.
      </p>

      <ReportPdfButtons
        organizationSelected={organizationId !== ALL_ORGANIZATIONS}
        viewUrl={getCashFlowPdfUrl(tenantId, { organizationId, from, to }, false)}
        downloadUrl={getCashFlowPdfUrl(tenantId, { organizationId, from, to }, true)}
      />

      {isLoading && <CardSkeleton />}

      {isError && <ErrorState message={getApiErrorMessage(error, 'Failed to load the cash flow report')} />}

      {report && report.byCurrency.length === 0 && (
        <EmptyState icon={Coins} title="No cash activity posted for this period" />
      )}

      {report && report.byCurrency.length > 0 && (
        <div className="grid gap-4 sm:grid-cols-3">
          {/* One card per currency, never blended - same reasoning as the P&L report. */}
          {report.byCurrency.map((byCurrency) => (
            <StatCard
              key={byCurrency.currency}
              label={`Net cash change (${byCurrency.currency})`}
              value={formatCurrency(byCurrency.netCashChange, byCurrency.currency)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
