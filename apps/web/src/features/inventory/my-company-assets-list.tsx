'use client';

import { Laptop } from 'lucide-react';
import { useMyCompanyAssets } from './queries';
import { CompanyAssetStatusBadge } from './company-asset-status-badge';
import { getApiErrorMessage, isNoEmployeeLinkedError } from '@/lib/api-error';
import { TableCard } from '@/components/table-card';
import { EmptyState } from '@/components/empty-state';
import { EmployeeLinkRequiredState } from '@/components/employee-link-required-state';
import { TableSkeleton } from '@/components/loading-state';
import { ErrorState } from '@/components/error-state';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

export function MyCompanyAssetsList({ tenantId }: { tenantId: string }) {
  const { data: assignments, isLoading, isError, error } = useMyCompanyAssets(tenantId);

  if (isLoading) {
    return <TableSkeleton />;
  }

  if (isError) {
    if (isNoEmployeeLinkedError(error)) {
      return <EmployeeLinkRequiredState />;
    }
    return <ErrorState message={getApiErrorMessage(error, 'Failed to load your assets')} />;
  }

  if (!assignments || assignments.length === 0) {
    return <EmptyState icon={Laptop} title="No assets assigned to you" />;
  }

  return (
    <TableCard>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Tag</TableHead>
            <TableHead>Name</TableHead>
            <TableHead>Category</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Assigned</TableHead>
            <TableHead>Returned</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {assignments.map((assignment) => (
            <TableRow key={assignment.id}>
              <TableCell className="font-mono text-muted-foreground">{assignment.asset.assetTag}</TableCell>
              <TableCell className="font-medium">{assignment.asset.name}</TableCell>
              <TableCell className="text-muted-foreground">{assignment.asset.category ?? '—'}</TableCell>
              <TableCell>
                <CompanyAssetStatusBadge status={assignment.asset.status} />
              </TableCell>
              <TableCell className="text-muted-foreground">{String(assignment.assignedAt).slice(0, 10)}</TableCell>
              <TableCell className="text-muted-foreground">
                {assignment.returnedAt ? String(assignment.returnedAt).slice(0, 10) : '—'}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableCard>
  );
}
