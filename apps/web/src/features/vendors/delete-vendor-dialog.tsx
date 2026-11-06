'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { useDeleteVendor } from './queries';
import type { Vendor } from './types';
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

export function DeleteVendorDialog({ tenantId, vendor }: { tenantId: string; vendor: Vendor }) {
  const [open, setOpen] = useState(false);
  const deleteVendor = useDeleteVendor(tenantId);

  async function handleDelete() {
    try {
      await deleteVendor.mutateAsync(vendor.id);
      toast.success(`"${vendor.name}" removed`);
      setOpen(false);
    } catch (error) {
      toast.error(getApiErrorMessage(error, 'Failed to remove vendor'));
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
          <DialogTitle>Delete &quot;{vendor.name}&quot;?</DialogTitle>
        </DialogHeader>
        <p className="text-sm text-muted-foreground">
          This removes {vendor.name} from your vendor list. Existing bills for this vendor are retained for
          records, but this action cannot be undone from the UI.
        </p>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)} disabled={deleteVendor.isPending}>
            Cancel
          </Button>
          <Button variant="destructive" onClick={handleDelete} disabled={deleteVendor.isPending}>
            {deleteVendor.isPending ? 'Deleting…' : 'Delete'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
