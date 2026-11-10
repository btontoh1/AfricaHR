'use client';

import { toast } from 'sonner';
import { ClipboardList } from 'lucide-react';
import { useCancelMyStockRequest, useInventoryProducts, useInventoryWarehouses, useMyStockRequests } from './queries';
import { StockRequestStatusBadge } from './stock-request-status-badge';
import { getApiErrorMessage, isNoEmployeeLinkedError } from '@/lib/api-error';
import { Button } from '@/components/ui/button';
import { TableCard } from '@/components/table-card';
import { EmptyState } from '@/components/empty-state';
import { EmployeeLinkRequiredState } from '@/components/employee-link-required-state';
import { TableSkeleton } from '@/components/loading-state';
import { ErrorState } from '@/components/error-state';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

export function MyStockRequestsList({ tenantId }: { tenantId: string }) {
  const { data: requests, isLoading, isError, error } = useMyStockRequests(tenantId);
  const { data: warehouses } = useInventoryWarehouses(tenantId);
  const { data: products } = useInventoryProducts(tenantId);
  const cancelRequest = useCancelMyStockRequest(tenantId);

  const warehouseName = (id: string) => warehouses?.find((w) => w.id === id)?.name ?? id;
  const productLabel = (id: string) => {
    const product = products?.find((p) => p.id === id);
    return product ? `${product.sku} — ${product.name}` : id;
  };

  async function handleCancel(id: string) {
    try {
      await cancelRequest.mutateAsync(id);
      toast.success('Stock request cancelled');
    } catch (cancelError) {
      toast.error(getApiErrorMessage(cancelError, 'Failed to cancel stock request'));
    }
  }

  if (isLoading) {
    return <TableSkeleton />;
  }

  if (isError) {
    if (isNoEmployeeLinkedError(error)) {
      return <EmployeeLinkRequiredState />;
    }
    return <ErrorState message={getApiErrorMessage(error, 'Failed to load stock requests')} />;
  }

  if (!requests || requests.length === 0) {
    return <EmptyState icon={ClipboardList} title="No stock requests yet" description="Requests you submit will appear here." />;
  }

  return (
    <TableCard>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Warehouse</TableHead>
            <TableHead>Product</TableHead>
            <TableHead>Quantity</TableHead>
            <TableHead>Reason</TableHead>
            <TableHead>Status</TableHead>
            <TableHead />
          </TableRow>
        </TableHeader>
        <TableBody>
          {requests.map((request) => (
            <TableRow key={request.id}>
              <TableCell className="text-muted-foreground">{warehouseName(request.warehouseId)}</TableCell>
              <TableCell>{productLabel(request.productId)}</TableCell>
              <TableCell>{request.quantity}</TableCell>
              <TableCell className="text-muted-foreground">{request.reason ?? '—'}</TableCell>
              <TableCell>
                <StockRequestStatusBadge status={request.status} />
              </TableCell>
              <TableCell>
                {request.status === 'PENDING' && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleCancel(request.id)}
                    disabled={cancelRequest.isPending}
                  >
                    Cancel
                  </Button>
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableCard>
  );
}
