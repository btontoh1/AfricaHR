'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { useDeleteTenant } from './queries';
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

export function DeleteTenantDialog({ tenantId, tenantName }: { tenantId: string; tenantName: string }) {
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const deleteTenant = useDeleteTenant(tenantId);

  async function handleDelete() {
    try {
      await deleteTenant.mutateAsync();
      toast.success(`"${tenantName}" deleted`);
      setOpen(false);
      router.push('/platform-admin/tenants');
    } catch (error) {
      toast.error(getApiErrorMessage(error, 'Failed to delete tenant'));
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="destructive" size="sm">
          Delete tenant
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Delete &quot;{tenantName}&quot;?</DialogTitle>
        </DialogHeader>
        <p className="text-sm text-muted-foreground">
          This permanently removes the tenant from every tenant list and lookup. Its data is retained for
          audit purposes but this action cannot be undone from the UI.
        </p>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)} disabled={deleteTenant.isPending}>
            Cancel
          </Button>
          <Button variant="destructive" onClick={handleDelete} disabled={deleteTenant.isPending}>
            {deleteTenant.isPending ? 'Deleting…' : 'Delete tenant'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
