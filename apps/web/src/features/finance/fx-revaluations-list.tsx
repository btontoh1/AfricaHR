'use client';

import { useState } from 'react';
import { History } from 'lucide-react';
import { useFxRevaluations } from './queries';
import { OrganizationFilter, ALL_ORGANIZATIONS } from '@/features/reporting/organization-filter';
import { getApiErrorMessage } from '@/lib/api-error';
import { TableCard } from '@/components/table-card';
import { EmptyState } from '@/components/empty-state';
import { TableSkeleton } from '@/components/loading-state';
import { ErrorState } from '@/components/error-state';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

export function FxRevaluationsList({ tenantId }: { tenantId: string }) {
  const [organizationId, setOrganizationId] = useState(ALL_ORGANIZATIONS);
  const scopedOrganizationId = organizationId === ALL_ORGANIZATIONS ? undefined : organizationId;
  const { data: revaluations, isLoading, isError, error } = useFxRevaluations(tenantId, scopedOrganizationId);

  return (
    <div className="space-y-4">
      <OrganizationFilter tenantId={tenantId} value={organizationId} onChange={setOrganizationId} />

      {isLoading && <TableSkeleton />}

      {isError && <ErrorState message={getApiErrorMessage(error, 'Failed to load FX revaluations')} />}

      {revaluations && revaluations.length === 0 && (
        <EmptyState
          icon={History}
          title="No FX revaluations yet"
          description="Run one above once a home currency is set for this organization."
        />
      )}

      {revaluations && revaluations.length > 0 && (
        <TableCard>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>As of</TableHead>
                <TableHead>Currency</TableHead>
                <TableHead className="text-right">Rate</TableHead>
                <TableHead className="text-right">Previous rate</TableHead>
                <TableHead className="text-right">Gain/loss</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {revaluations.map((revaluation) => (
                <TableRow key={revaluation.id}>
                  <TableCell>{revaluation.asOfDate.slice(0, 10)}</TableCell>
                  <TableCell className="text-muted-foreground">{revaluation.currency}</TableCell>
                  <TableCell className="text-right">{revaluation.rate}</TableCell>
                  <TableCell className="text-right text-muted-foreground">
                    {revaluation.previousRate ?? '—'}
                  </TableCell>
                  <TableCell className="text-right">
                    {revaluation.gainLoss === null || revaluation.gainLoss === undefined ? (
                      '—'
                    ) : (
                      <span className={Number(revaluation.gainLoss) < 0 ? 'text-destructive' : ''}>
                        {revaluation.gainLoss}
                      </span>
                    )}
                  </TableCell>
                  <TableCell>
                    {revaluation.journalEntryId ? (
                      <Badge variant="success">Posted</Badge>
                    ) : revaluation.previousRate ? (
                      <Badge variant="secondary">No balance</Badge>
                    ) : (
                      <Badge variant="outline">Baseline</Badge>
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
