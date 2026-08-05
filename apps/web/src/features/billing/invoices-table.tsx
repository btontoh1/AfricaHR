'use client';

import { toast } from 'sonner';
import { FileText, ExternalLink } from 'lucide-react';
import { useGenerateInvoice, useInvoices, useMarkInvoicePaid } from './queries';
import { CancelInvoiceDialog } from './cancel-invoice-dialog';
import { InvoiceStatusBadge } from './invoice-status-badge';
import { getApiErrorMessage } from '@/lib/api-error';
import { formatCurrency } from '@/lib/format-currency';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/empty-state';
import { ErrorState } from '@/components/error-state';
import { TableSkeleton } from '@/components/loading-state';
import { TableCard } from '@/components/table-card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

export function InvoicesTable({
  tenantId,
  canGenerate,
}: {
  tenantId: string;
  /** Generating an invoice requires an active subscription - the backend enforces this too, this just avoids an obviously-doomed click. */
  canGenerate: boolean;
}) {
  const { data: invoices, isLoading, isError, error } = useInvoices(tenantId);
  const generateInvoice = useGenerateInvoice(tenantId);
  const markPaid = useMarkInvoicePaid(tenantId);
  // The backend rejects generate() while a PENDING invoice exists (see
  // InvoiceService.generate) - checked here too so the button explains why
  // it's disabled instead of the user finding out from an error toast.
  const hasPendingInvoice = invoices?.some((invoice) => invoice.status === 'PENDING') ?? false;

  async function handleGenerate() {
    try {
      await generateInvoice.mutateAsync();
      toast.success('Invoice generated');
    } catch (generateError) {
      toast.error(getApiErrorMessage(generateError, 'Failed to generate invoice'));
    }
  }

  async function handleMarkPaid(id: string) {
    try {
      await markPaid.mutateAsync(id);
      toast.success('Invoice marked paid');
    } catch (markPaidError) {
      toast.error(getApiErrorMessage(markPaidError, 'Failed to mark invoice paid'));
    }
  }

  const generateButton = (
    <Button
      size="sm"
      disabled={!canGenerate || hasPendingInvoice || generateInvoice.isPending}
      title={hasPendingInvoice ? 'Cancel the pending invoice below before generating another' : undefined}
      onClick={handleGenerate}
    >
      {generateInvoice.isPending ? 'Generating…' : 'Generate invoice'}
    </Button>
  );

  if (isLoading) {
    return <TableSkeleton rows={3} />;
  }

  if (isError) {
    return <ErrorState message={getApiErrorMessage(error, 'Failed to load invoices')} />;
  }

  if (!invoices || invoices.length === 0) {
    return (
      <EmptyState
        icon={FileText}
        title="No invoices yet"
        description={
          canGenerate
            ? 'Generate the first invoice for the current billing period.'
            : 'Assign an active subscription before generating invoices.'
        }
        action={generateButton}
      />
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex justify-end">{generateButton}</div>
      <TableCard>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Period</TableHead>
              <TableHead>Amount</TableHead>
              <TableHead>Headcount</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Due</TableHead>
              <TableHead />
            </TableRow>
          </TableHeader>
          <TableBody>
            {invoices.map((invoice) => (
              <TableRow key={invoice.id}>
                <TableCell className="text-muted-foreground">
                  {invoice.periodStart.slice(0, 10)} – {invoice.periodEnd.slice(0, 10)}
                </TableCell>
                <TableCell>{formatCurrency(invoice.amount, invoice.currency)}</TableCell>
                <TableCell>{invoice.employeeCountAtIssue}</TableCell>
                <TableCell>
                  <InvoiceStatusBadge status={invoice.status} />
                </TableCell>
                <TableCell className="text-muted-foreground">{invoice.dueDate.slice(0, 10)}</TableCell>
                <TableCell className="flex items-center justify-end gap-2">
                  {invoice.checkoutUrl && invoice.status === 'PENDING' && (
                    <Button variant="outline" size="sm" asChild>
                      <a href={invoice.checkoutUrl} target="_blank" rel="noreferrer">
                        Checkout <ExternalLink className="size-3.5" />
                      </a>
                    </Button>
                  )}
                  {invoice.status === 'PENDING' && (
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={markPaid.isPending}
                      onClick={() => handleMarkPaid(invoice.id)}
                    >
                      Mark paid
                    </Button>
                  )}
                  {invoice.status === 'PENDING' && (
                    <CancelInvoiceDialog tenantId={tenantId} invoiceId={invoice.id} />
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableCard>
    </div>
  );
}
