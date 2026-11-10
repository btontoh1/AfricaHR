'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { Trash2 } from 'lucide-react';
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

/** Shared delete confirmation for the inventory master-data lists (units, unit conversions, categories, products, warehouses) - same shape as finance's DeleteRecurringJournalEntryDialog, parameterized over which mutation and label to use. */
export function DeleteEntityDialog({
  label,
  onDelete,
  errorMessage,
}: {
  label: string;
  onDelete: () => Promise<unknown>;
  errorMessage: string;
}) {
  const [open, setOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  async function handleDelete() {
    setIsDeleting(true);
    try {
      await onDelete();
      toast.success('Deleted');
      setOpen(false);
    } catch (error) {
      toast.error(getApiErrorMessage(error, errorMessage));
    } finally {
      setIsDeleting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Trash2 className="size-4" />
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Delete &quot;{label}&quot;?</DialogTitle>
        </DialogHeader>
        <p className="text-sm text-muted-foreground">This cannot be undone.</p>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)} disabled={isDeleting}>
            Cancel
          </Button>
          <Button variant="destructive" onClick={handleDelete} disabled={isDeleting}>
            {isDeleting ? 'Deleting…' : 'Delete'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
