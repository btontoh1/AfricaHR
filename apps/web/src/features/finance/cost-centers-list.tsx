'use client';

import { Tags } from 'lucide-react';
import { useCostCenters } from './queries';
import { useOrganizations } from '@/features/organizations/queries';
import { useSession } from '@/app/(app)/session-provider';
import { getApiErrorMessage } from '@/lib/api-error';
import { TableCard } from '@/components/table-card';
import { EmptyState } from '@/components/empty-state';
import { TableSkeleton } from '@/components/loading-state';
import { ErrorState } from '@/components/error-state';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

export function CostCentersList({ tenantId }: { tenantId: string }) {
  const session = useSession();
  const isOrgAdmin = session.role === 'ORG_ADMIN';
  const { data: costCenters, isLoading, isError, error } = useCostCenters(tenantId);
  // Only needed to resolve organizationId -> name for tenant-wide roles that
  // see cost centers across multiple organizations - an ORG_ADMIN's list is
  // already scoped to their one organization, so the column is redundant.
  const { data: organizations } = useOrganizations(tenantId);
  const organizationName = (organizationId: string) =>
    organizations?.find((organization) => organization.id === organizationId)?.legalName ?? organizationId;

  if (isLoading) {
    return <TableSkeleton />;
  }

  if (isError) {
    return <ErrorState message={getApiErrorMessage(error, 'Failed to load cost centers')} />;
  }

  if (!costCenters || costCenters.length === 0) {
    return <EmptyState icon={Tags} title="No cost centers yet" description="Add your first cost center above." />;
  }

  return (
    <TableCard>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Code</TableHead>
            {!isOrgAdmin && <TableHead>Organization</TableHead>}
          </TableRow>
        </TableHeader>
        <TableBody>
          {costCenters.map((costCenter) => (
            <TableRow key={costCenter.id}>
              <TableCell className="font-medium">{costCenter.name}</TableCell>
              <TableCell className="text-muted-foreground">{costCenter.code ?? '—'}</TableCell>
              {!isOrgAdmin && (
                <TableCell className="text-muted-foreground">{organizationName(costCenter.organizationId)}</TableCell>
              )}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableCard>
  );
}
