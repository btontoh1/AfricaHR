'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Download, Eye, Pencil, Trash2 } from 'lucide-react';
import { useInvoice, useUpdateInvoiceStatus, useDeleteInvoice, getInvoicePdfUrl } from './queries';
import { nextInvoiceStatuses } from './invoice-status-transition';
import { InvoiceStatusBadge } from './invoice-status-badge';
import type { CustomerInvoiceStatus } from './types';
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
  SENT: 'Mark as sent',
  PAID: 'Mark as paid',
  OVERDUE: 'Mark as overdue',
  CANCELLED: 'Cancel invoice',
};

function Field({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="text-sm">{value ?? '—'}</div>
    </div>
  );
}

export function InvoiceDetail({ tenantId, invoiceId }: { tenantId: string; invoiceId: string }) {
  const router = useRouter();
  const [deleteOpen, setDeleteOpen] = useState(false);
  const { data: invoice, isLoading, isError, error } = useInvoice(tenantId, invoiceId);
  const updateStatus = useUpdateInvoiceStatus(tenantId, invoiceId);
  const deleteInvoice = useDeleteInvoice(tenantId);

  async function handleStatusChange(status: CustomerInvoiceStatus) {
    try {
      await updateStatus.mutateAsync(status);
      toast.success('Invoice status updated');
    } catch (statusError) {
      toast.error(getApiErrorMessage(statusError, 'Failed to update invoice status'));
    }
  }

  async function handleDelete() {
    try {
      await deleteInvoice.mutateAsync(invoiceId);
      toast.success('Invoice deleted');
      router.push('/invoices');
    } catch (deleteError) {
      toast.error(getApiErrorMessage(deleteError, 'Failed to delete invoice'));
    }
  }

  if (isLoading) {
    return <CardSkeleton />;
  }

  if (isError || !invoice) {
    return <ErrorState message={getApiErrorMessage(error, 'Failed to load invoice')} />;
  }

  const isDraft = invoice.status === 'DRAFT';

  return (
    <div className="space-y-6">
      <PageHeader
        title={invoice.invoiceNumber}
        description={invoice.customerName}
        action={
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" asChild>
              <a href={getInvoicePdfUrl(tenantId, invoice.id, false)} target="_blank" rel="noreferrer">
                <Eye className="size-4" />
                View PDF
              </a>
            </Button>
            <Button variant="outline" asChild>
              <a href={getInvoicePdfUrl(tenantId, invoice.id, true)}>
                <Download className="size-4" />
                Download PDF
              </a>
            </Button>
            {isDraft && (
              <Button variant="outline" asChild>
                <Link href={`/invoices/${invoice.id}/edit`}>
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
                    <DialogTitle>Delete &quot;{invoice.invoiceNumber}&quot;?</DialogTitle>
                  </DialogHeader>
                  <p className="text-sm text-muted-foreground">This action cannot be undone.</p>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setDeleteOpen(false)} disabled={deleteInvoice.isPending}>
                      Cancel
                    </Button>
                    <Button variant="destructive" onClick={handleDelete} disabled={deleteInvoice.isPending}>
                      {deleteInvoice.isPending ? 'Deleting…' : 'Delete'}
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
          <Field label="Status" value={<InvoiceStatusBadge status={invoice.status} />} />
          <Field label="Customer" value={invoice.customerName} />
          <Field label="Issue date" value={invoice.issueDate.slice(0, 10)} />
          <Field label="Due date" value={invoice.dueDate.slice(0, 10)} />
          <Field label="Currency" value={invoice.currency} />
          {invoice.notes && <Field label="Notes" value={invoice.notes} />}
        </CardContent>
        {nextInvoiceStatuses(invoice.status).length > 0 && (
          <CardContent className="flex flex-wrap gap-2 border-t border-border pt-4">
            {nextInvoiceStatuses(invoice.status).map((status) => (
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
                {invoice.lineItems.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell>{item.description}</TableCell>
                    <TableCell className="text-muted-foreground">{item.quantity}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {formatCurrency(item.unitPrice, invoice.currency)}
                    </TableCell>
                    <TableCell>{formatCurrency(item.amount, invoice.currency)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableCard>

          <div className="ml-auto max-w-xs space-y-1 border-t border-border pt-4 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Subtotal</span>
              <span>{formatCurrency(invoice.subtotal, invoice.currency)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Tax ({invoice.taxRate}%)</span>
              <span>{formatCurrency(invoice.taxAmount, invoice.currency)}</span>
            </div>
            <div className="flex justify-between font-medium">
              <span>Total</span>
              <span>{formatCurrency(invoice.total, invoice.currency)}</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
