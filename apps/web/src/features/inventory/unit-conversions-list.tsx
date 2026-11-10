'use client';

import { ArrowLeftRight } from 'lucide-react';
import { useDeleteInventoryUnitConversion, useInventoryUnitConversions, useInventoryUnits } from './queries';
import { DeleteEntityDialog } from './delete-entity-dialog';
import { getApiErrorMessage } from '@/lib/api-error';
import { TableCard } from '@/components/table-card';
import { EmptyState } from '@/components/empty-state';
import { TableSkeleton } from '@/components/loading-state';
import { ErrorState } from '@/components/error-state';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

export function UnitConversionsList({ tenantId }: { tenantId: string }) {
  const { data: conversions, isLoading, isError, error } = useInventoryUnitConversions(tenantId);
  const { data: units } = useInventoryUnits(tenantId);
  const deleteConversion = useDeleteInventoryUnitConversion(tenantId);

  const unitLabel = (unitId: string) => {
    const unit = units?.find((candidate) => candidate.id === unitId);
    return unit ? `${unit.name} (${unit.abbreviation})` : unitId;
  };

  if (isLoading) {
    return <TableSkeleton />;
  }

  if (isError) {
    return <ErrorState message={getApiErrorMessage(error, 'Failed to load unit conversions')} />;
  }

  if (!conversions || conversions.length === 0) {
    return (
      <EmptyState
        icon={ArrowLeftRight}
        title="No conversions yet"
        description="Add a conversion above, e.g. 1 carton = 20 box."
      />
    );
  }

  return (
    <TableCard>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Larger unit</TableHead>
            <TableHead>Smaller unit</TableHead>
            <TableHead>Factor</TableHead>
            <TableHead />
          </TableRow>
        </TableHeader>
        <TableBody>
          {conversions.map((conversion) => (
            <TableRow key={conversion.id}>
              <TableCell className="font-medium">{unitLabel(conversion.fromUnitId)}</TableCell>
              <TableCell className="font-medium">{unitLabel(conversion.toUnitId)}</TableCell>
              <TableCell className="text-muted-foreground">{Number(conversion.factor)}</TableCell>
              <TableCell className="text-right">
                <DeleteEntityDialog
                  label={`${unitLabel(conversion.fromUnitId)} → ${unitLabel(conversion.toUnitId)}`}
                  onDelete={() => deleteConversion.mutateAsync(conversion.id)}
                  errorMessage="Failed to delete conversion"
                />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableCard>
  );
}
