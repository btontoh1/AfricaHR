'use client';

import { useState } from 'react';
import { History } from 'lucide-react';
import { useInventoryProducts, useInventoryWarehouses, useStockBatches, useStockLedger } from './queries';
import { ReverseStockEntryDialog } from './reverse-stock-entry-dialog';
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

const TRANSACTION_TYPE_VARIANT: Record<string, BadgeVariant> = {
  GOODS_RECEIVED: 'success',
  GOODS_ISSUED: 'warning',
  TRANSFER_OUT: 'secondary',
  TRANSFER_IN: 'secondary',
  ADJUSTMENT_IN: 'success',
  ADJUSTMENT_OUT: 'warning',
  REVERSAL: 'outline',
};

const TRANSACTION_TYPE_LABELS: Record<string, string> = {
  GOODS_RECEIVED: 'Goods received',
  GOODS_ISSUED: 'Goods issued',
  TRANSFER_OUT: 'Transfer out',
  TRANSFER_IN: 'Transfer in',
  ADJUSTMENT_IN: 'Adjustment in',
  ADJUSTMENT_OUT: 'Adjustment out',
  REVERSAL: 'Reversal',
};

export function StockLedgerList({ tenantId }: { tenantId: string }) {
  const [warehouseId, setWarehouseId] = useState(ALL_WAREHOUSES);
  const scopedWarehouseId = warehouseId === ALL_WAREHOUSES ? undefined : warehouseId;
  const { data: entries, isLoading, isError, error } = useStockLedger(tenantId, { warehouseId: scopedWarehouseId });
  const { data: warehouses } = useInventoryWarehouses(tenantId);
  const { data: products } = useInventoryProducts(tenantId);
  const { data: batches } = useStockBatches(tenantId);

  const warehouseLabel = (id: string) => {
    const warehouse = warehouses?.find((candidate) => candidate.id === id);
    return warehouse ? `${warehouse.name} (${warehouse.code})` : id;
  };
  const productLabel = (id: string) => {
    const product = products?.find((candidate) => candidate.id === id);
    return product ? `${product.sku} — ${product.name}` : id;
  };
  const batchLabel = (id?: string | null) => {
    if (!id) return null;
    return batches?.find((candidate) => candidate.id === id)?.batchNumber ?? null;
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

      {isError && <ErrorState message={getApiErrorMessage(error, 'Failed to load the stock ledger')} />}

      {entries && entries.length === 0 && (
        <EmptyState icon={History} title="No stock movements yet" />
      )}

      {entries && entries.length > 0 && (
        <TableCard>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Warehouse</TableHead>
                <TableHead>Product</TableHead>
                <TableHead>Batch</TableHead>
                <TableHead>In</TableHead>
                <TableHead>Out</TableHead>
                <TableHead>Note</TableHead>
                <TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              {entries.map((entry) => (
                <TableRow key={entry.id}>
                  <TableCell className="text-muted-foreground">{entry.createdAt.slice(0, 10)}</TableCell>
                  <TableCell>
                    <Badge variant={TRANSACTION_TYPE_VARIANT[entry.transactionType] ?? 'outline'}>
                      {TRANSACTION_TYPE_LABELS[entry.transactionType] ?? entry.transactionType}
                    </Badge>
                  </TableCell>
                  <TableCell className="font-medium">{warehouseLabel(entry.warehouseId)}</TableCell>
                  <TableCell>{productLabel(entry.productId)}</TableCell>
                  <TableCell className="font-mono text-muted-foreground">{batchLabel(entry.batchId) ?? '—'}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {Number(entry.quantityIn) > 0 ? Number(entry.quantityIn) : '—'}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {Number(entry.quantityOut) > 0 ? Number(entry.quantityOut) : '—'}
                  </TableCell>
                  <TableCell className="text-muted-foreground">{entry.note ?? '—'}</TableCell>
                  <TableCell className="text-right">
                    {!entry.reversalOfId && entry.transactionType !== 'REVERSAL' && (
                      <ReverseStockEntryDialog tenantId={tenantId} entryId={entry.id} />
                    )}
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
