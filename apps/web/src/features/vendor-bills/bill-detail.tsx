'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Pencil, Trash2 } from 'lucide-react';
import { useVendorBill, useUpdateVendorBillStatus, useDeleteVendorBill } from './queries';
import { nextBillStatuses } from './bill-status-transition';
import { BillStatusBadge } from './bill-status-badge';
import type { VendorBillStatus } from './types';
import { getApiErrorMessage } from '@/lib/api-error';
import { formatCurrency } from '@/lib/format-currency';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CardSkeleton } from '@/components/loading-state';
import { ErrorState } from '@/components/error-state';
import { PageHeader } from '@/components/page-header';
import { TableCard } from '@/components/table-card';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

const STATUS_ACTION_LABEL: Record<string, string> = {
  APPROVED: 'Approve bill',
  PAID: 'Mark as paid',
  OVERDUE: 'Mark as overdue',
  CANCELLED: 'Cancel bill',
};

function Field({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="text-sm">{value ?? '—'}</div>
    </div>
  );
}

export function BillDetail({ tenantId, billId }: { tenantId: string; billId: string }) {
  const router = useRouter();
  const [deleteOpen, setDeleteOpen] = useState(false);
  const { data: bill, isLoading, isError, error } = useVendorBill(tenantId, billId);
  const updateStatus = useUpdateVendorBillStatus(tenantId, billId);
  const deleteBill = useDeleteVendorBill(tenantId);

  async function handleStatusChange(status: VendorBillStatus) {
    try {
      await updateStatus.mutateAsync(status);
      toast.success('Bill status updated');
    } catch (statusError) {
      toast.error(getApiErrorMessage(statusError, 'Failed to update bill status'));
    }
  }

  async function handleDelete() {
    try {
      await deleteBill.mutateAsync(billId);
      toast.success('Bill deleted');
      router.push('/vendor-bills');
    } catch (deleteError) {
      toast.error(getApiErrorMessage(deleteError, 'Failed to delete bill'));
    }
  }

  if (isLoading) {
    return <CardSkeleton />;
  }

  if (isError || !bill) {
    return <ErrorState message={getApiErrorMessage(error, 'Failed to load bill')} />;
  }

  const isDraft = bill.status === 'DRAFT';

  return (
    <div className="space-y-6">
      <PageHeader
        title={bill.billNumber}
        description={bill.vendorName}
        backHref="/vendor-bills"
        action={
          <div className="flex flex-wrap gap-2">
            {isDraft && (
              <Button variant="outline" asChild>
                <Link href={`/vendor-bills/${bill.id}/edit`}>
                  <Pencil className="size-4" />
                  Edit
                </Link>
              </Button>
            )}
            {isDraft && (
              <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline">
                    <Trash2 className="size-4" />
                    Delete
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Delete &quot;{bill.billNumber}&quot;?</DialogTitle>
                  </DialogHeader>
                  <p className="text-sm text-muted-foreground">This action cannot be undone.</p>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setDeleteOpen(false)} disabled={deleteBill.isPending}>
                      Cancel
                    </Button>
                    <Button variant="destructive" onClick={handleDelete} disabled={deleteBill.isPending}>
                      {deleteBill.isPending ? 'Deleting…' : 'Delete'}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            )}
          </div>
        }
      />

      <Card>
        <CardHeader>
          <CardTitle>Details</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-4">
          <Field label="Status" value={<BillStatusBadge status={bill.status} />} />
          <Field label="Vendor" value={bill.vendorName} />
          <Field label="Vendor's invoice #" value={bill.vendorReference} />
          <Field label="Bill date" value={bill.billDate.slice(0, 10)} />
          <Field label="Due date" value={bill.dueDate.slice(0, 10)} />
          <Field label="Currency" value={bill.currency} />
          {bill.notes && <Field label="Notes" value={bill.notes} />}
        </CardContent>
        {nextBillStatuses(bill.status).length > 0 && (
          <CardContent className="flex flex-wrap gap-2 border-t border-border pt-4">
            {nextBillStatuses(bill.status).map((status) => (
              <Button
                key={status}
                variant="outline"
                size="sm"
                onClick={() => handleStatusChange(status)}
                disabled={updateStatus.isPending}
              >
                {STATUS_ACTION_LABEL[status] ?? status}
              </Button>
            ))}
          </CardContent>
        )}
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Line items</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <TableCard>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Description</TableHead>
                  <TableHead>Qty</TableHead>
                  <TableHead>Unit price</TableHead>
                  <TableHead>Amount</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {bill.lineItems.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell>{item.description}</TableCell>
                    <TableCell className="text-muted-foreground">{item.quantity}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {formatCurrency(item.unitPrice, bill.currency)}
                    </TableCell>
                    <TableCell>{formatCurrency(item.amount, bill.currency)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableCard>

          <div className="ml-auto max-w-xs space-y-1 border-t border-border pt-4 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Subtotal</span>
              <span>{formatCurrency(bill.subtotal, bill.currency)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Tax ({bill.taxRate}%)</span>
              <span>{formatCurrency(bill.taxAmount, bill.currency)}</span>
            </div>
            <div className="flex justify-between font-medium">
              <span>Total</span>
              <span>{formatCurrency(bill.total, bill.currency)}</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
