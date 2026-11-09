'use client';

import { useState } from 'react';
import { Boxes } from 'lucide-react';
import { useInventoryProducts, useInventoryWarehouses, useStockBalances } from './queries';
import { getApiErrorMessage } from '@/lib/api-error';
import { TableCard } from '@/components/table-card';
import { EmptyState } from '@/components/empty-state';
import { TableSkeleton } from '@/components/loading-state';
import { ErrorState } from '@/components/error-state';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const ALL_WAREHOUSES = 'ALL';

export function StockBalancesList({ tenantId }: { tenantId: string }) {
  const [warehouseId, setWarehouseId] = useState(ALL_WAREHOUSES);
  const scopedWarehouseId = warehouseId === ALL_WAREHOUSES ? undefined : warehouseId;
  const { data: balances, isLoading, isError, error } = useStockBalances(tenantId, scopedWarehouseId);
  const { data: warehouses } = useInventoryWarehouses(tenantId);
  const { data: products } = useInventoryProducts(tenantId);

  const warehouseLabel = (id: string) => {
    const warehouse = warehouses?.find((candidate) => candidate.id === id);
    return warehouse ? `${warehouse.name} (${warehouse.code})` : id;
  };
  const product = (id: string) => products?.find((candidate) => candidate.id === id);

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

      {isError && <ErrorState message={getApiErrorMessage(error, 'Failed to load stock balances')} />}

      {balances && balances.length === 0 && (
        <EmptyState icon={Boxes} title="No stock balances yet" description="Receive goods to start tracking stock." />
      )}

      {balances && balances.length > 0 && (
        <TableCard>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Warehouse</TableHead>
                <TableHead>Product</TableHead>
                <TableHead>Quantity</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {balances.map((balance) => {
                const matchedProduct = product(balance.productId);
                return (
                  <TableRow key={`${balance.warehouseId}:${balance.productId}`}>
                    <TableCell className="font-medium">{warehouseLabel(balance.warehouseId)}</TableCell>
                    <TableCell>
                      {matchedProduct ? `${matchedProduct.sku} — ${matchedProduct.name}` : balance.productId}
                    </TableCell>
                    <TableCell className="text-muted-foreground">{balance.quantity}</TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </TableCard>
      )}
    </div>
  );
}
