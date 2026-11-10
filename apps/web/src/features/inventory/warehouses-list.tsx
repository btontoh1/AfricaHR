'use client';

import { toast } from 'sonner';
import { Warehouse } from 'lucide-react';
import { useDeleteInventoryWarehouse, useInventoryWarehouses, useUpdateInventoryWarehouse } from './queries';
import { DeleteEntityDialog } from './delete-entity-dialog';
import { useOrganizations } from '@/features/organizations/queries';
import { useSession } from '@/app/(app)/session-provider';
import { getApiErrorMessage } from '@/lib/api-error';
import { TableCard } from '@/components/table-card';
import { EmptyState } from '@/components/empty-state';
import { TableSkeleton } from '@/components/loading-state';
import { ErrorState } from '@/components/error-state';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

export function WarehousesList({ tenantId }: { tenantId: string }) {
  const session = useSession();
  const isOrgAdmin = session.role === 'ORG_ADMIN';
  const { data: warehouses, isLoading, isError, error } = useInventoryWarehouses(tenantId);
  const { data: organizations } = useOrganizations(tenantId);
  const updateWarehouse = useUpdateInventoryWarehouse(tenantId);
  const deleteWarehouse = useDeleteInventoryWarehouse(tenantId);

  const organizationName = (organizationId: string) =>
    organizations?.find((organization) => organization.id === organizationId)?.legalName ?? organizationId;

  async function handleToggleActive(id: string, isActive: boolean) {
    try {
      await updateWarehouse.mutateAsync({ id, isActive });
    } catch (toggleError) {
      toast.error(getApiErrorMessage(toggleError, 'Failed to update warehouse'));
    }
  }

  if (isLoading) {
    return <TableSkeleton />;
  }

  if (isError) {
    return <ErrorState message={getApiErrorMessage(error, 'Failed to load warehouses')} />;
  }

  if (!warehouses || warehouses.length === 0) {
    return <EmptyState icon={Warehouse} title="No warehouses yet" description="Add your first warehouse above." />;
  }

  return (
    <TableCard>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Code</TableHead>
            {!isOrgAdmin && <TableHead>Organization</TableHead>}
            <TableHead>Address</TableHead>
            <TableHead>Status</TableHead>
            <TableHead />
          </TableRow>
        </TableHeader>
        <TableBody>
          {warehouses.map((warehouse) => (
            <TableRow key={warehouse.id}>
              <TableCell className="font-medium">{warehouse.name}</TableCell>
              <TableCell className="text-muted-foreground">{warehouse.code}</TableCell>
              {!isOrgAdmin && (
                <TableCell className="text-muted-foreground">
                  {organizationName(warehouse.organizationId)}
                </TableCell>
              )}
              <TableCell className="text-muted-foreground">{warehouse.address ?? '—'}</TableCell>
              <TableCell>
                <div className="flex items-center gap-2">
                  <Switch
                    checked={warehouse.isActive}
                    onCheckedChange={(checked) => handleToggleActive(warehouse.id, checked)}
                    disabled={updateWarehouse.isPending}
                  />
                  <Badge variant={warehouse.isActive ? 'success' : 'secondary'}>
                    {warehouse.isActive ? 'Active' : 'Inactive'}
                  </Badge>
                </div>
              </TableCell>
              <TableCell className="text-right">
                <DeleteEntityDialog
                  label={warehouse.name}
                  onDelete={() => deleteWarehouse.mutateAsync(warehouse.id)}
                  errorMessage="Failed to delete warehouse"
                />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableCard>
  );
}
