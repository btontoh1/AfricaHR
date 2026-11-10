'use client';

import { useState } from 'react';
import Link from 'next/link';
import { FileStack } from 'lucide-react';
import { useInventoryVendors, useInventoryWarehouses, usePurchaseOrders } from './queries';
import { PurchaseOrderStatusBadge } from './purchase-order-status-badge';
import type { PurchaseOrderStatus } from './types';
import { getApiErrorMessage } from '@/lib/api-error';
import { TableCard } from '@/components/table-card';
import { EmptyState } from '@/components/empty-state';
import { TableSkeleton } from '@/components/loading-state';
import { ErrorState } from '@/components/error-state';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

const STATUS_FILTERS: (PurchaseOrderStatus | 'ALL')[] = [
  'ALL',
  'DRAFT',
  'SENT',
  'PARTIALLY_RECEIVED',
  'RECEIVED',
  'CANCELLED',
];

export function PurchaseOrdersList({ tenantId }: { tenantId: string }) {
  const [statusFilter, setStatusFilter] = useState<PurchaseOrderStatus | 'ALL'>('ALL');
  const { data: purchaseOrders, isLoading, isError, error } = usePurchaseOrders(tenantId, {
    status: statusFilter === 'ALL' ? undefined : statusFilter,
  });
  const { data: warehouses } = useInventoryWarehouses(tenantId);
  const { data: vendors } = useInventoryVendors(tenantId);

  const warehouseName = (id: string) => warehouses?.find((w) => w.id === id)?.name ?? id;
  const vendorName = (id: string) => vendors?.find((v) => v.id === id)?.name ?? id;

  return (
    <div className="space-y-4">
      <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value as typeof statusFilter)}>
        <SelectTrigger className="w-48">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {STATUS_FILTERS.map((status) => (
            <SelectItem key={status} value={status}>
              {status.replace('_', ' ')}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {isLoading && <TableSkeleton />}

      {isError && <ErrorState message={getApiErrorMessage(error, 'Failed to load purchase orders')} />}

      {purchaseOrders && purchaseOrders.length === 0 && (
        <EmptyState icon={FileStack} title="No purchase orders match this filter" />
      )}

      {purchaseOrders && purchaseOrders.length > 0 && (
        <TableCard>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>PO #</TableHead>
                <TableHead>Vendor</TableHead>
                <TableHead>Warehouse</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Order date</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {purchaseOrders.map((po) => (
                <TableRow key={po.id}>
                  <TableCell className="font-medium">
                    <Link href={`/inventory/procurement/purchase-orders/${po.id}`} className="hover:underline">
                      {po.poNumber}
                    </Link>
                  </TableCell>
                  <TableCell>{vendorName(po.vendorId)}</TableCell>
                  <TableCell className="text-muted-foreground">{warehouseName(po.warehouseId)}</TableCell>
                  <TableCell>
                    <PurchaseOrderStatusBadge status={po.status} />
                  </TableCell>
                  <TableCell className="text-muted-foreground">{po.orderDate.slice(0, 10)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableCard>
      )}
    </div>
  );
}
