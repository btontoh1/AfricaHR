'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { useCancelInvoice } from './queries';
import { getApiErrorMessage } from '@/lib/api-error';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

export function CancelInvoiceDialog({ tenantId, invoiceId }: { tenantId: string; invoiceId: string }) {
  const [open, setOpen] = useState(false);
  const cancelInvoice = useCancelInvoice(tenantId);

  async function handleCancel() {
    try {
      await cancelInvoice.mutateAsync(invoiceId);
      toast.success('Invoice cancelled');
      setOpen(false);
    } catch (error) {
      toast.error(getApiErrorMessage(error, 'Failed to cancel invoice'));
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          Cancel
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Cancel this invoice?</DialogTitle>
        </DialogHeader>
        <p className="text-sm text-muted-foreground">
          This voids the invoice (e.g. a duplicate created by clicking &quot;Generate invoice&quot; twice) so it
          no longer shows as owed. It cannot be reversed from the UI - generate a new invoice if one is still
          needed.
        </p>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)} disabled={cancelInvoice.isPending}>
            Keep invoice
          </Button>
          <Button variant="destructive" onClick={handleCancel} disabled={cancelInvoice.isPending}>
            {cancelInvoice.isPending ? 'Cancelling…' : 'Cancel invoice'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
