'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { useDeleteOrganizationUnit } from './queries';
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

export function RemoveOrganizationUnitDialog({
  tenantId,
  organizationId,
  unitId,
  unitName,
}: {
  tenantId: string;
  organizationId: string;
  unitId: string;
  unitName: string;
}) {
  const [open, setOpen] = useState(false);
  const deleteUnit = useDeleteOrganizationUnit(tenantId, organizationId, unitId);

  async function handleRemove() {
    try {
      await deleteUnit.mutateAsync();
      toast.success(`"${unitName}" removed`);
      setOpen(false);
    } catch (error) {
      toast.error(getApiErrorMessage(error, 'Failed to remove unit'));
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="destructive" size="sm">
          Remove
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Remove &quot;{unitName}&quot;?</DialogTitle>
        </DialogHeader>
        <p className="text-sm text-muted-foreground">
          This unit will no longer be available to assign to employees or requisitions. It must have no
          child units and no employees currently assigned to it.
        </p>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)} disabled={deleteUnit.isPending}>
            Cancel
          </Button>
          <Button variant="destructive" onClick={handleRemove} disabled={deleteUnit.isPending}>
            {deleteUnit.isPending ? 'Removing…' : 'Remove'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
