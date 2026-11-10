'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { ClipboardList } from 'lucide-react';
import { useApproveStockRequest, useInventoryProducts, useInventoryWarehouses, useStockRequests } from './queries';
import { useEmployees } from '@/features/employees/queries';
import { StockRequestStatusBadge } from './stock-request-status-badge';
import { RejectStockRequestDialog } from './reject-stock-request-dialog';
import type { StockRequestStatus } from './types';
import { getApiErrorMessage } from '@/lib/api-error';
import { Button } from '@/components/ui/button';
import { TableCard } from '@/components/table-card';
import { EmptyState } from '@/components/empty-state';
import { TableSkeleton } from '@/components/loading-state';
import { ErrorState } from '@/components/error-state';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

const STATUS_FILTERS: (StockRequestStatus | 'ALL')[] = ['ALL', 'PENDING', 'APPROVED', 'FULFILLED', 'REJECTED', 'CANCELLED'];

export function StockRequestsList({ tenantId }: { tenantId: string }) {
  const [statusFilter, setStatusFilter] = useState<StockRequestStatus | 'ALL'>('PENDING');
  const { data: requests, isLoading, isError, error } = useStockRequests(tenantId, {
    status: statusFilter === 'ALL' ? undefined : statusFilter,
  });
  const { data: warehouses } = useInventoryWarehouses(tenantId);
  const { data: products } = useInventoryProducts(tenantId);
  const { data: employees } = useEmployees(tenantId);
  const approveRequest = useApproveStockRequest(tenantId);

  const warehouseName = (id: string) => warehouses?.find((w) => w.id === id)?.name ?? id;
  const productLabel = (id: string) => {
    const product = products?.find((p) => p.id === id);
    return product ? `${product.sku} — ${product.name}` : id;
  };
  const employeeName = (id: string) => {
    const employee = employees?.find((e) => e.id === id);
    return employee ? `${employee.firstName} ${employee.lastName}` : id;
  };

  async function handleApprove(id: string) {
    try {
      await approveRequest.mutateAsync(id);
      toast.success('Stock request approved and fulfilled');
    } catch (approveError) {
      toast.error(getApiErrorMessage(approveError, 'Failed to approve stock request'));
    }
  }

  return (
    <div className="space-y-4">
      <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value as typeof statusFilter)}>
        <SelectTrigger className="w-48">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {STATUS_FILTERS.map((status) => (
            <SelectItem key={status} value={status}>
              {status}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {isLoading && <TableSkeleton />}

      {isError && <ErrorState message={getApiErrorMessage(error, 'Failed to load stock requests')} />}

      {requests && requests.length === 0 && (
        <EmptyState icon={ClipboardList} title="No stock requests match this filter" />
      )}

      {requests && requests.length > 0 && (
        <TableCard>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Requested by</TableHead>
                <TableHead>Warehouse</TableHead>
                <TableHead>Product</TableHead>
                <TableHead>Quantity</TableHead>
                <TableHead>Reason</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {requests.map((request) => (
                <TableRow key={request.id}>
                  <TableCell>{employeeName(request.requestedByEmployeeId)}</TableCell>
                  <TableCell className="text-muted-foreground">{warehouseName(request.warehouseId)}</TableCell>
                  <TableCell>{productLabel(request.productId)}</TableCell>
                  <TableCell>{request.quantity}</TableCell>
                  <TableCell className="text-muted-foreground">{request.reason ?? '—'}</TableCell>
                  <TableCell>
                    <StockRequestStatusBadge status={request.status} />
                  </TableCell>
                  <TableCell className="text-right">
                    {request.status === 'PENDING' && (
                      <div className="flex justify-end gap-2">
                        <Button size="sm" onClick={() => handleApprove(request.id)} disabled={approveRequest.isPending}>
                          Approve
                        </Button>
                        <RejectStockRequestDialog tenantId={tenantId} id={request.id} />
                      </div>
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
