'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { useDeleteBudget } from './queries';
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

export function DeleteBudgetDialog({
  tenantId,
  budgetId,
  accountName,
}: {
  tenantId: string;
  budgetId: string;
  accountName: string;
}) {
  const [open, setOpen] = useState(false);
  const deleteBudget = useDeleteBudget(tenantId);

  async function handleDelete() {
    try {
      await deleteBudget.mutateAsync(budgetId);
      toast.success('Budget removed');
      setOpen(false);
    } catch (error) {
      toast.error(getApiErrorMessage(error, 'Failed to remove budget'));
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          Remove
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Remove the budget for &quot;{accountName}&quot;?</DialogTitle>
        </DialogHeader>
        <p className="text-sm text-muted-foreground">
          This only removes the budgeted amount - it has no effect on any journal entries or actual
          activity already posted to this account.
        </p>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)} disabled={deleteBudget.isPending}>
            Cancel
          </Button>
          <Button variant="destructive" onClick={handleDelete} disabled={deleteBudget.isPending}>
            {deleteBudget.isPending ? 'Removing…' : 'Remove'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
