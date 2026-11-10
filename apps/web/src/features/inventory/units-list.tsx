'use client';

import { toast } from 'sonner';
import { Ruler } from 'lucide-react';
import { useDeleteInventoryUnit, useInventoryUnits, useUpdateInventoryUnit } from './queries';
import { DeleteEntityDialog } from './delete-entity-dialog';
import { getApiErrorMessage } from '@/lib/api-error';
import { TableCard } from '@/components/table-card';
import { EmptyState } from '@/components/empty-state';
import { TableSkeleton } from '@/components/loading-state';
import { ErrorState } from '@/components/error-state';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

export function UnitsList({ tenantId }: { tenantId: string }) {
  const { data: units, isLoading, isError, error } = useInventoryUnits(tenantId);
  const updateUnit = useUpdateInventoryUnit(tenantId);
  const deleteUnit = useDeleteInventoryUnit(tenantId);

  async function handleToggleActive(id: string, isActive: boolean) {
    try {
      await updateUnit.mutateAsync({ id, isActive });
    } catch (toggleError) {
      toast.error(getApiErrorMessage(toggleError, 'Failed to update unit'));
    }
  }

  if (isLoading) {
    return <TableSkeleton />;
  }

  if (isError) {
    return <ErrorState message={getApiErrorMessage(error, 'Failed to load units')} />;
  }

  if (!units || units.length === 0) {
    return <EmptyState icon={Ruler} title="No units yet" description="Add your first unit above." />;
  }

  return (
    <TableCard>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Abbreviation</TableHead>
            <TableHead>Status</TableHead>
            <TableHead />
          </TableRow>
        </TableHeader>
        <TableBody>
          {units.map((unit) => (
            <TableRow key={unit.id}>
              <TableCell className="font-medium">{unit.name}</TableCell>
              <TableCell className="text-muted-foreground">{unit.abbreviation}</TableCell>
              <TableCell>
                <div className="flex items-center gap-2">
                  <Switch
                    checked={unit.isActive}
                    onCheckedChange={(checked) => handleToggleActive(unit.id, checked)}
                    disabled={updateUnit.isPending}
                  />
                  <Badge variant={unit.isActive ? 'success' : 'secondary'}>
                    {unit.isActive ? 'Active' : 'Inactive'}
                  </Badge>
                </div>
              </TableCell>
              <TableCell className="text-right">
                <DeleteEntityDialog
                  label={unit.name}
                  onDelete={() => deleteUnit.mutateAsync(unit.id)}
                  errorMessage="Failed to delete unit"
                />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableCard>
  );
}
