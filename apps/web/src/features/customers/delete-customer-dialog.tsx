'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { useDeleteCustomer } from './queries';
import type { Customer } from './types';
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

export function DeleteCustomerDialog({ tenantId, customer }: { tenantId: string; customer: Customer }) {
  const [open, setOpen] = useState(false);
  const deleteCustomer = useDeleteCustomer(tenantId);

  async function handleDelete() {
    try {
      await deleteCustomer.mutateAsync(customer.id);
      toast.success(`"${customer.name}" removed`);
      setOpen(false);
    } catch (error) {
      toast.error(getApiErrorMessage(error, 'Failed to remove customer'));
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          Delete
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Delete &quot;{customer.name}&quot;?</DialogTitle>
        </DialogHeader>
        <p className="text-sm text-muted-foreground">
          This removes {customer.name} from your customer list. Existing invoices for this customer are
          retained for records, but this action cannot be undone from the UI.
        </p>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)} disabled={deleteCustomer.isPending}>
            Cancel
          </Button>
          <Button variant="destructive" onClick={handleDelete} disabled={deleteCustomer.isPending}>
            {deleteCustomer.isPending ? 'Deleting…' : 'Delete'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
