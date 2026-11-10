'use client';

import { toast } from 'sonner';
import { PackagePlus } from 'lucide-react';
import {
  useInventoryProducts,
  useInventoryVendors,
  useInventoryWarehouses,
  usePurchaseOrder,
  useSendPurchaseOrder,
  useCancelPurchaseOrder,
} from './queries';
import { PurchaseOrderStatusBadge } from './purchase-order-status-badge';
import { ReceiveGoodsDialog } from './receive-goods-dialog';
import { getApiErrorMessage } from '@/lib/api-error';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CardSkeleton } from '@/components/loading-state';
import { ErrorState } from '@/components/error-state';
import { PageHeader } from '@/components/page-header';
import { TableCard } from '@/components/table-card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

function Field({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="text-sm">{value ?? '—'}</div>
    </div>
  );
}

export function PurchaseOrderDetail({ tenantId, poId }: { tenantId: string; poId: string }) {
  const { data: po, isLoading, isError, error } = usePurchaseOrder(tenantId, poId);
  const { data: warehouses } = useInventoryWarehouses(tenantId);
  const { data: vendors } = useInventoryVendors(tenantId);
  const { data: products } = useInventoryProducts(tenantId);
  const sendPo = useSendPurchaseOrder(tenantId);
  const cancelPo = useCancelPurchaseOrder(tenantId);

  const warehouseName = (id: string) => warehouses?.find((w) => w.id === id)?.name ?? id;
  const vendorName = (id: string) => vendors?.find((v) => v.id === id)?.name ?? id;
  const productLabel = (id: string) => {
    const product = products?.find((p) => p.id === id);
    return product ? `${product.sku} — ${product.name}` : id;
  };

  async function handleSend() {
    try {
      await sendPo.mutateAsync(poId);
      toast.success('Purchase order sent');
    } catch (sendError) {
      toast.error(getApiErrorMessage(sendError, 'Failed to send purchase order'));
    }
  }

  async function handleCancel() {
    try {
      await cancelPo.mutateAsync(poId);
      toast.success('Purchase order cancelled');
    } catch (cancelError) {
      toast.error(getApiErrorMessage(cancelError, 'Failed to cancel purchase order'));
    }
  }

  if (isLoading) {
    return <CardSkeleton />;
  }

  if (isError || !po) {
    return <ErrorState message={getApiErrorMessage(error, 'Failed to load purchase order')} />;
  }

  const canReceive = po.status === 'SENT' || po.status === 'PARTIALLY_RECEIVED';

  return (
    <div className="space-y-6">
      <PageHeader
        title={po.poNumber}
        description={vendorName(po.vendorId)}
        backHref="/inventory/procurement/purchase-orders"
        action={
          <div className="flex flex-wrap gap-2">
            {po.status === 'DRAFT' && (
              <>
                <Button onClick={handleSend} disabled={sendPo.isPending}>
                  Send to vendor
                </Button>
                <Button variant="outline" onClick={handleCancel} disabled={cancelPo.isPending}>
                  Cancel
                </Button>
              </>
            )}
            {po.status === 'SENT' && (
              <Button variant="outline" onClick={handleCancel} disabled={cancelPo.isPending}>
                Cancel
              </Button>
            )}
          </div>
        }
      />

      <Card>
        <CardHeader>
          <CardTitle>Details</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-4">
          <Field label="Status" value={<PurchaseOrderStatusBadge status={po.status} />} />
          <Field label="Vendor" value={vendorName(po.vendorId)} />
          <Field label="Warehouse" value={warehouseName(po.warehouseId)} />
          <Field label="Order date" value={po.orderDate.slice(0, 10)} />
          <Field label="Expected date" value={po.expectedDate?.slice(0, 10)} />
          {po.notes && <Field label="Notes" value={po.notes} />}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Lines</CardTitle>
        </CardHeader>
        <CardContent>
          <TableCard>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Product</TableHead>
                  <TableHead>Quantity</TableHead>
                  <TableHead>Unit cost</TableHead>
                  <TableHead>Received</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {po.lines.map((line) => {
                  const fullyReceived = Number(line.quantityReceived) >= Number(line.quantity);
                  return (
                    <TableRow key={line.id}>
                      <TableCell>{productLabel(line.productId)}</TableCell>
                      <TableCell>{line.quantity}</TableCell>
                      <TableCell className="text-muted-foreground">{line.unitCost}</TableCell>
                      <TableCell className="text-muted-foreground">
                        {line.quantityReceived} / {line.quantity}
                      </TableCell>
                      <TableCell className="text-right">
                        {canReceive && !fullyReceived && (
                          <ReceiveGoodsDialog
                            tenantId={tenantId}
                            purchaseOrderLineId={line.id}
                            presetWarehouseId={po.warehouseId}
                            presetProductId={line.productId}
                            trigger={
                              <Button size="sm" variant="outline">
                                <PackagePlus className="size-4" />
                                Receive
                              </Button>
                            }
                          />
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableCard>
        </CardContent>
      </Card>
    </div>
  );
}
