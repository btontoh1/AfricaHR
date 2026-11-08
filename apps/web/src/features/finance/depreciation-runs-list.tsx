'use client';

import { useState } from 'react';
import { History } from 'lucide-react';
import { useDepreciationRuns } from './queries';
import { OrganizationFilter, ALL_ORGANIZATIONS } from '@/features/reporting/organization-filter';
import { getApiErrorMessage } from '@/lib/api-error';
import { formatCurrency } from '@/lib/format-currency';
import { TableCard } from '@/components/table-card';
import { EmptyState } from '@/components/empty-state';
import { TableSkeleton } from '@/components/loading-state';
import { ErrorState } from '@/components/error-state';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

export function DepreciationRunsList({ tenantId }: { tenantId: string }) {
  const [organizationId, setOrganizationId] = useState(ALL_ORGANIZATIONS);
  const scopedOrganizationId = organizationId === ALL_ORGANIZATIONS ? undefined : organizationId;
  const { data: runs, isLoading, isError, error } = useDepreciationRuns(tenantId, scopedOrganizationId);

  return (
    <div className="space-y-4">
      <OrganizationFilter tenantId={tenantId} value={organizationId} onChange={setOrganizationId} />

      {isLoading && <TableSkeleton />}

      {isError && <ErrorState message={getApiErrorMessage(error, 'Failed to load depreciation runs')} />}

      {runs && runs.length === 0 && (
        <EmptyState
          icon={History}
          title="No depreciation runs yet"
          description="Run one above once you have at least one active fixed asset."
        />
      )}

      {runs && runs.length > 0 && (
        <TableCard>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>As of</TableHead>
                <TableHead>Currency</TableHead>
                <TableHead className="text-right">Assets</TableHead>
                <TableHead className="text-right">Total depreciation</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {runs.map((run) => (
                <TableRow key={run.id}>
                  <TableCell>{run.asOfDate.slice(0, 10)}</TableCell>
                  <TableCell className="text-muted-foreground">{run.currency}</TableCell>
                  <TableCell className="text-right">{run.assetCount}</TableCell>
                  <TableCell className="text-right">{formatCurrency(run.totalDepreciation, run.currency)}</TableCell>
                  <TableCell>
                    {run.journalEntryId ? (
                      <Badge variant="success">Posted</Badge>
                    ) : (
                      <Badge variant="secondary">Nothing due</Badge>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableCard>
      )}
    </div>
  );
}
