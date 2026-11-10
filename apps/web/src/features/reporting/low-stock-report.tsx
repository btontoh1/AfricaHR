'use client';

import { useState } from 'react';
import { PackageSearch } from 'lucide-react';
import { useLowStockReport } from './queries';
import { StatCard } from './stat-card';
import { useInventoryWarehouses } from '@/features/inventory/queries';
import { getApiErrorMessage } from '@/lib/api-error';
import { TableCard } from '@/components/table-card';
import { TableSkeleton } from '@/components/loading-state';
import { ErrorState } from '@/components/error-state';
import { EmptyState } from '@/components/empty-state';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const ALL_WAREHOUSES = 'ALL';

export function LowStockReport({ tenantId }: { tenantId: string }) {
  const [warehouseId, setWarehouseId] = useState(ALL_WAREHOUSES);
  const scopedWarehouseId = warehouseId === ALL_WAREHOUSES ? undefined : warehouseId;

  const { data: report, isLoading, isError, error } = useLowStockReport(tenantId, {
    warehouseId: scopedWarehouseId,
  });
  const { data: warehouses } = useInventoryWarehouses(tenantId);

  return (
    <div className="space-y-4">
      <Select value={warehouseId} onValueChange={setWarehouseId}>
        <SelectTrigger className="w-64">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={ALL_WAREHOUSES}>All warehouses</SelectItem>
          {warehouses?.map((warehouse) => (
            <SelectItem key={warehouse.id} value={warehouse.id}>
              {warehouse.name} ({warehouse.code})
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {isLoading && <TableSkeleton />}

      {isError && <ErrorState message={getApiErrorMessage(error, 'Failed to load the low stock report')} />}

      {report && report.length === 0 && (
        <EmptyState
          icon={PackageSearch}
          title="Nothing below its reorder point"
          description="Products with no minimum stock level set are not included here."
        />
      )}

      {report && report.length > 0 && (
        <div className="space-y-4">
          <div className="max-w-xs">
            <StatCard label="Products below reorder point" value={report.length} icon={PackageSearch} />
          </div>
          <TableCard>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Warehouse</TableHead>
                  <TableHead>Product</TableHead>
                  <TableHead>On hand</TableHead>
                  <TableHead>Reorder point</TableHead>
                  <TableHead>Shortfall</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {report.map((row) => (
                  <TableRow key={`${row.warehouseId}:${row.productId}`}>
                    <TableCell className="font-medium">{row.warehouseName}</TableCell>
                    <TableCell>
                      {row.productSku} — {row.productName}
                    </TableCell>
                    <TableCell className="text-muted-foreground">{row.quantity}</TableCell>
                    <TableCell className="text-muted-foreground">{row.minStockLevel}</TableCell>
                    <TableCell className="font-medium text-destructive">{row.shortfall}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableCard>
        </div>
      )}
    </div>
  );
}
