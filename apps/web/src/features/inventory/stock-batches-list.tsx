'use client';

import { useState } from 'react';
import { FlaskConical } from 'lucide-react';
import { useInventoryProducts, useInventoryWarehouses, useStockBatches } from './queries';
import { getApiErrorMessage } from '@/lib/api-error';
import { TableCard } from '@/components/table-card';
import { EmptyState } from '@/components/empty-state';
import { TableSkeleton } from '@/components/loading-state';
import { ErrorState } from '@/components/error-state';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { VariantProps } from 'class-variance-authority';
import type { badgeVariants } from '@/components/ui/badge';

const ALL_WAREHOUSES = 'ALL';

type BadgeVariant = VariantProps<typeof badgeVariants>['variant'];

const STATUS_VARIANT: Record<string, BadgeVariant> = {
  OK: 'success',
  EXPIRING_SOON: 'warning',
  EXPIRED: 'destructive',
};

const STATUS_LABELS: Record<string, string> = {
  OK: 'OK',
  EXPIRING_SOON: 'Expiring soon',
  EXPIRED: 'Expired',
};

export function StockBatchesList({ tenantId }: { tenantId: string }) {
  const [warehouseId, setWarehouseId] = useState(ALL_WAREHOUSES);
  const scopedWarehouseId = warehouseId === ALL_WAREHOUSES ? undefined : warehouseId;
  const { data: batches, isLoading, isError, error } = useStockBatches(tenantId, { warehouseId: scopedWarehouseId });
  const { data: warehouses } = useInventoryWarehouses(tenantId);
  const { data: products } = useInventoryProducts(tenantId);

  const warehouseLabel = (id: string) => {
    const warehouse = warehouses?.find((candidate) => candidate.id === id);
    return warehouse ? `${warehouse.name} (${warehouse.code})` : id;
  };
  const productLabel = (id: string) => {
    const product = products?.find((candidate) => candidate.id === id);
    return product ? `${product.sku} — ${product.name}` : id;
  };

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

      {isError && <ErrorState message={getApiErrorMessage(error, 'Failed to load batches')} />}

      {batches && batches.length === 0 && (
        <EmptyState
          icon={FlaskConical}
          title="No batches yet"
          description="Receive a batch-tracked product above to start tracking lots and expiry."
        />
      )}

      {batches && batches.length > 0 && (
        <TableCard>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Batch</TableHead>
                <TableHead>Product</TableHead>
                <TableHead>Warehouse</TableHead>
                <TableHead>Expiry date</TableHead>
                <TableHead>Remaining</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {batches.map((batch) => (
                <TableRow key={batch.id}>
                  <TableCell className="font-mono text-muted-foreground">{batch.batchNumber}</TableCell>
                  <TableCell className="font-medium">{productLabel(batch.productId)}</TableCell>
                  <TableCell>{warehouseLabel(batch.warehouseId)}</TableCell>
                  <TableCell className="text-muted-foreground">{batch.expiryDate.slice(0, 10)}</TableCell>
                  <TableCell className="text-muted-foreground">{batch.remainingQuantity}</TableCell>
                  <TableCell>
                    <Badge variant={STATUS_VARIANT[batch.status] ?? 'outline'}>
                      {STATUS_LABELS[batch.status] ?? batch.status}
                    </Badge>
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
