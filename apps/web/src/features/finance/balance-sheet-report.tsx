'use client';

import { useState } from 'react';
import { Scale } from 'lucide-react';
import { useBalanceSheetReport } from './queries';
import { OrganizationFilter, ALL_ORGANIZATIONS } from '@/features/reporting/organization-filter';
import { StatCard } from '@/features/reporting/stat-card';
import { getApiErrorMessage } from '@/lib/api-error';
import { formatCurrency } from '@/lib/format-currency';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { CardSkeleton } from '@/components/loading-state';
import { ErrorState } from '@/components/error-state';
import { EmptyState } from '@/components/empty-state';

function today(): string {
  return new Date().toISOString().slice(0, 10);
}

export function BalanceSheetReport({ tenantId }: { tenantId: string }) {
  const [organizationId, setOrganizationId] = useState(ALL_ORGANIZATIONS);
  const [asOf, setAsOf] = useState(today());

  const { data: report, isLoading, isError, error } = useBalanceSheetReport(tenantId, {
    organizationId: organizationId === ALL_ORGANIZATIONS ? undefined : organizationId,
    asOf,
  });

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end gap-3">
        <OrganizationFilter tenantId={tenantId} value={organizationId} onChange={setOrganizationId} />
        <div>
          <Label htmlFor="balance-sheet-as-of">As of</Label>
          <Input
            id="balance-sheet-as-of"
            type="date"
            value={asOf}
            onChange={(e) => setAsOf(e.target.value)}
          />
        </div>
      </div>

      <p className="text-sm text-muted-foreground">
        A snapshot of account balances as of the date above, not a period. There is no dedicated Equity
        account yet, so Equity is shown as retained earnings — cumulative revenue minus expense since the
        general ledger began.
      </p>

      {isLoading && <CardSkeleton />}

      {isError && <ErrorState message={getApiErrorMessage(error, 'Failed to load the balance sheet')} />}

      {report && report.byCurrency.length === 0 && (
        <EmptyState icon={Scale} title="No activity posted as of this date" />
      )}

      {report && report.byCurrency.length > 0 && (
        <div className="space-y-6">
          {/*
            One card group per currency, never blended into a single total -
            same reasoning as ProfitAndLossReport/CashFlowReport. See
            finance-domain's computeBalanceSheet.
          */}
          {report.byCurrency.map((byCurrency) => (
            <div key={byCurrency.currency} className="space-y-2">
              <h3 className="text-sm font-medium text-muted-foreground">{byCurrency.currency}</h3>
              <div className="grid gap-4 sm:grid-cols-3">
                <StatCard
                  label="Assets"
                  value={formatCurrency(byCurrency.totalAssets, byCurrency.currency)}
                />
                <StatCard
                  label="Liabilities"
                  value={formatCurrency(byCurrency.totalLiabilities, byCurrency.currency)}
                />
                <StatCard
                  label="Equity"
                  value={formatCurrency(byCurrency.totalEquity, byCurrency.currency)}
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
