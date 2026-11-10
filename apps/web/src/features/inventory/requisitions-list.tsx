'use client';

import { Fragment, useState } from 'react';
import { toast } from 'sonner';
import { ClipboardList, ChevronDown, ChevronRight } from 'lucide-react';
import { useInventoryProducts, useInventoryWarehouses, useRequisitions, useSubmitRequisition, useApproveRequisition, useCancelRequisition } from './queries';
import { useEmployees } from '@/features/employees/queries';
import { RequisitionStatusBadge } from './requisition-status-badge';
import { RejectRequisitionDialog } from './reject-requisition-dialog';
import { ConvertRequisitionToPoDialog } from './convert-requisition-to-po-dialog';
import type { PurchaseRequisitionStatus } from './types';
import { getApiErrorMessage } from '@/lib/api-error';
import { Button } from '@/components/ui/button';
import { TableCard } from '@/components/table-card';
import { EmptyState } from '@/components/empty-state';
import { TableSkeleton } from '@/components/loading-state';
import { ErrorState } from '@/components/error-state';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

const STATUS_FILTERS: (PurchaseRequisitionStatus | 'ALL')[] = [
  'ALL',
  'DRAFT',
  'SUBMITTED',
  'APPROVED',
  'REJECTED',
  'CONVERTED',
  'CANCELLED',
];

export function RequisitionsList({ tenantId }: { tenantId: string }) {
  const [statusFilter, setStatusFilter] = useState<PurchaseRequisitionStatus | 'ALL'>('ALL');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const { data: requisitions, isLoading, isError, error } = useRequisitions(tenantId, {
    status: statusFilter === 'ALL' ? undefined : statusFilter,
  });
  const { data: warehouses } = useInventoryWarehouses(tenantId);
  const { data: employees } = useEmployees(tenantId);
  const { data: products } = useInventoryProducts(tenantId);
  const submitRequisition = useSubmitRequisition(tenantId);
  const approveRequisition = useApproveRequisition(tenantId);
  const cancelRequisition = useCancelRequisition(tenantId);

  const warehouseName = (id: string) => warehouses?.find((w) => w.id === id)?.name ?? id;
  const employeeName = (id: string) => {
    const employee = employees?.find((e) => e.id === id);
    return employee ? `${employee.firstName} ${employee.lastName}` : id;
  };
  const productLabel = (id: string) => {
    const product = products?.find((p) => p.id === id);
    return product ? `${product.sku} — ${product.name}` : id;
  };

  async function handleSubmit(id: string) {
    try {
      await submitRequisition.mutateAsync(id);
      toast.success('Requisition submitted');
    } catch (submitError) {
      toast.error(getApiErrorMessage(submitError, 'Failed to submit requisition'));
    }
  }

  async function handleApprove(id: string) {
    try {
      await approveRequisition.mutateAsync({ id });
      toast.success('Requisition approved');
    } catch (approveError) {
      toast.error(getApiErrorMessage(approveError, 'Failed to approve requisition'));
    }
  }

  async function handleCancel(id: string) {
    try {
      await cancelRequisition.mutateAsync(id);
      toast.success('Requisition cancelled');
    } catch (cancelError) {
      toast.error(getApiErrorMessage(cancelError, 'Failed to cancel requisition'));
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

      {isError && <ErrorState message={getApiErrorMessage(error, 'Failed to load requisitions')} />}

      {requisitions && requisitions.length === 0 && (
        <EmptyState icon={ClipboardList} title="No requisitions match this filter" />
      )}

      {requisitions && requisitions.length > 0 && (
        <TableCard>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead />
                <TableHead>Warehouse</TableHead>
                <TableHead>Requested by</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Lines</TableHead>
                <TableHead>Created</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {requisitions.map((requisition) => {
                const expanded = expandedId === requisition.id;
                return (
                  <Fragment key={requisition.id}>
                    <TableRow>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setExpandedId(expanded ? null : requisition.id)}
                          aria-label="Toggle lines"
                        >
                          {expanded ? <ChevronDown className="size-4" /> : <ChevronRight className="size-4" />}
                        </Button>
                      </TableCell>
                      <TableCell>{warehouseName(requisition.warehouseId)}</TableCell>
                      <TableCell>{employeeName(requisition.requestedByEmployeeId)}</TableCell>
                      <TableCell>
                        <RequisitionStatusBadge status={requisition.status} />
                      </TableCell>
                      <TableCell className="text-muted-foreground">{requisition.lines.length}</TableCell>
                      <TableCell className="text-muted-foreground">{requisition.createdAt.slice(0, 10)}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex flex-wrap justify-end gap-2">
                          {requisition.status === 'DRAFT' && (
                            <Button size="sm" onClick={() => handleSubmit(requisition.id)} disabled={submitRequisition.isPending}>
                              Submit
                            </Button>
                          )}
                          {requisition.status === 'SUBMITTED' && (
                            <>
                              <Button size="sm" onClick={() => handleApprove(requisition.id)} disabled={approveRequisition.isPending}>
                                Approve
                              </Button>
                              <RejectRequisitionDialog tenantId={tenantId} id={requisition.id} />
                            </>
                          )}
                          {requisition.status === 'APPROVED' && (
                            <>
                              <ConvertRequisitionToPoDialog tenantId={tenantId} id={requisition.id} />
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleCancel(requisition.id)}
                                disabled={cancelRequisition.isPending}
                              >
                                Cancel
                              </Button>
                            </>
                          )}
                          {requisition.status === 'DRAFT' && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleCancel(requisition.id)}
                              disabled={cancelRequisition.isPending}
                            >
                              Cancel
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                    {expanded && (
                      <TableRow>
                        <TableCell colSpan={7} className="bg-muted/30">
                          <div className="space-y-2 py-2">
                            {requisition.notes && (
                              <p className="text-sm text-muted-foreground">Notes: {requisition.notes}</p>
                            )}
                            {requisition.reviewNote && (
                              <p className="text-sm text-muted-foreground">Review note: {requisition.reviewNote}</p>
                            )}
                            <Table>
                              <TableHeader>
                                <TableRow>
                                  <TableHead>Product</TableHead>
                                  <TableHead>Quantity</TableHead>
                                  <TableHead>Est. unit cost</TableHead>
                                </TableRow>
                              </TableHeader>
                              <TableBody>
                                {requisition.lines.map((line) => (
                                  <TableRow key={line.id}>
                                    <TableCell>{productLabel(line.productId)}</TableCell>
                                    <TableCell>{line.quantity}</TableCell>
                                    <TableCell className="text-muted-foreground">
                                      {line.estimatedUnitCost ?? '—'}
                                    </TableCell>
                                  </TableRow>
                                ))}
                              </TableBody>
                            </Table>
                          </div>
                        </TableCell>
                      </TableRow>
                    )}
                  </Fragment>
                );
              })}
            </TableBody>
          </Table>
        </TableCard>
      )}
    </div>
  );
}
