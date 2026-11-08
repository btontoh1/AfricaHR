'use client';

import { Truck } from 'lucide-react';
import { useVendors } from './queries';
import { EditVendorDialog } from './edit-vendor-dialog';
import { DeleteVendorDialog } from './delete-vendor-dialog';
import { useOrganizations } from '@/features/organizations/queries';
import { useSession } from '@/app/(app)/session-provider';
import { getApiErrorMessage } from '@/lib/api-error';
import { TableCard } from '@/components/table-card';
import { EmptyState } from '@/components/empty-state';
import { TableSkeleton } from '@/components/loading-state';
import { ErrorState } from '@/components/error-state';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

export function VendorsList({ tenantId }: { tenantId: string }) {
  const session = useSession();
  const isOrgAdmin = session.role === 'ORG_ADMIN';
  const { data: vendors, isLoading, isError, error } = useVendors(tenantId);
  // Only needed to resolve organizationId -> name for tenant-wide roles that
  // see vendors across multiple organizations - an ORG_ADMIN's list is
  // already scoped to their one organization, so the column is redundant.
  const { data: organizations } = useOrganizations(tenantId);
  const organizationName = (organizationId: string) =>
    organizations?.find((organization) => organization.id === organizationId)?.legalName ?? organizationId;

  if (isLoading) {
    return <TableSkeleton />;
  }

  if (isError) {
    return <ErrorState message={getApiErrorMessage(error, 'Failed to load vendors')} />;
  }

  if (!vendors || vendors.length === 0) {
    return <EmptyState icon={Truck} title="No vendors yet" description="Add your first vendor above." />;
  }

  return (
    <TableCard>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            {!isOrgAdmin && <TableHead>Organization</TableHead>}
            <TableHead>Email</TableHead>
            <TableHead>Phone</TableHead>
            <TableHead />
          </TableRow>
        </TableHeader>
        <TableBody>
          {vendors.map((vendor) => (
            <TableRow key={vendor.id}>
              <TableCell className="font-medium">{vendor.name}</TableCell>
              {!isOrgAdmin && (
                <TableCell className="text-muted-foreground">{organizationName(vendor.organizationId)}</TableCell>
              )}
              <TableCell className="text-muted-foreground">{vendor.email ?? '—'}</TableCell>
              <TableCell className="text-muted-foreground">{vendor.phone ?? '—'}</TableCell>
              <TableCell>
                <div className="flex justify-end gap-2">
                  <EditVendorDialog tenantId={tenantId} vendor={vendor} />
                  <DeleteVendorDialog tenantId={tenantId} vendor={vendor} />
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableCard>
  );
}
