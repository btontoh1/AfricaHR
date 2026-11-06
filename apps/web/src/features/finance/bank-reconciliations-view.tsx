'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ListChecks } from 'lucide-react';
import { useBankReconciliations } from './queries';
import { CreateReconciliationDialog } from './create-reconciliation-dialog';
import { BankReconciliationStatusBadge } from './bank-reconciliation-status-badge';
import { OrganizationFilter, ALL_ORGANIZATIONS } from '@/features/reporting/organization-filter';
import { getApiErrorMessage } from '@/lib/api-error';
import { formatCurrency } from '@/lib/format-currency';
import { TableCard } from '@/components/table-card';
import { EmptyState } from '@/components/empty-state';
import { TableSkeleton } from '@/components/loading-state';
import { ErrorState } from '@/components/error-state';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

export function BankReconciliationsView({ tenantId }: { tenantId: string }) {
  const [organizationId, setOrganizationId] = useState(ALL_ORGANIZATIONS);
  const scopedOrganizationId = organizationId === ALL_ORGANIZATIONS ? undefined : organizationId;
  const { data: reconciliations, isLoading, isError, error } = useBankReconciliations(tenantId, scopedOrganizationId);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <OrganizationFilter tenantId={tenantId} value={organizationId} onChange={setOrganizationId} />
        <CreateReconciliationDialog tenantId={tenantId} defaultOrganizationId={scopedOrganizationId} />
      </div>

      {isLoading && <TableSkeleton />}

      {isError && <ErrorState message={getApiErrorMessage(error, 'Failed to load bank reconciliations')} />}

      {reconciliations && reconciliations.length === 0 && (
        <EmptyState
          icon={ListChecks}
          title="No bank reconciliations yet"
          description="Start one above with your bank statement's ending balance."
        />
      )}

      {reconciliations && reconciliations.length > 0 && (
        <TableCard>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Statement date</TableHead>
                <TableHead>Currency</TableHead>
                <TableHead className="text-right">Statement ending balance</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {reconciliations.map((reconciliation) => (
                <TableRow key={reconciliation.id} className="cursor-pointer">
                  <TableCell className="p-0">
                    <Link
                      href={`/finance/bank-reconciliations/${reconciliation.id}`}
                      className="block px-4 py-3"
                    >
                      {reconciliation.statementDate.slice(0, 10)}
                    </Link>
                  </TableCell>
                  <TableCell className="text-muted-foreground">{reconciliation.currency}</TableCell>
                  <TableCell className="text-right">
                    {formatCurrency(reconciliation.statementEndingBalance, reconciliation.currency)}
                  </TableCell>
                  <TableCell>
                    <BankReconciliationStatusBadge status={reconciliation.status} />
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
