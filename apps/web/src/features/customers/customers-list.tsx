'use client';

import { Users } from 'lucide-react';
import { useCustomers } from './queries';
import { EditCustomerDialog } from './edit-customer-dialog';
import { DeleteCustomerDialog } from './delete-customer-dialog';
import { useOrganizations } from '@/features/organizations/queries';
import { useSession } from '@/app/(app)/session-provider';
import { getApiErrorMessage } from '@/lib/api-error';
import { TableCard } from '@/components/table-card';
import { EmptyState } from '@/components/empty-state';
import { TableSkeleton } from '@/components/loading-state';
import { ErrorState } from '@/components/error-state';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

export function CustomersList({ tenantId }: { tenantId: string }) {
  const session = useSession();
  const isOrgAdmin = session.role === 'ORG_ADMIN';
  const { data: customers, isLoading, isError, error } = useCustomers(tenantId);
  // Only needed to resolve organizationId -> name for tenant-wide roles
  // that see customers across multiple organizations - an ORG_ADMIN's list
  // is already scoped to their one organization, so the column is redundant
  // (and useOrganizations would 403 for them on other orgs anyway).
  const { data: organizations } = useOrganizations(tenantId);
  const organizationName = (organizationId: string) =>
    organizations?.find((organization) => organization.id === organizationId)?.legalName ?? organizationId;

  if (isLoading) {
    return <TableSkeleton />;
  }

  if (isError) {
    return <ErrorState message={getApiErrorMessage(error, 'Failed to load customers')} />;
  }

  if (!customers || customers.length === 0) {
    return (
      <EmptyState icon={Users} title="No customers yet" description="Add your first customer above." />
    );
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
          {customers.map((customer) => (
            <TableRow key={customer.id}>
              <TableCell className="font-medium">{customer.name}</TableCell>
              {!isOrgAdmin && (
                <TableCell className="text-muted-foreground">{organizationName(customer.organizationId)}</TableCell>
              )}
              <TableCell className="text-muted-foreground">{customer.email ?? '—'}</TableCell>
              <TableCell className="text-muted-foreground">{customer.phone ?? '—'}</TableCell>
              <TableCell>
                <div className="flex justify-end gap-2">
                  <EditCustomerDialog tenantId={tenantId} customer={customer} />
                  <DeleteCustomerDialog tenantId={tenantId} customer={customer} />
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableCard>
  );
}
