'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { useDisposeFixedAsset } from './queries';
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

export function DisposeFixedAssetDialog({
  tenantId,
  assetId,
  description,
}: {
  tenantId: string;
  assetId: string;
  description: string;
}) {
  const [open, setOpen] = useState(false);
  const disposeFixedAsset = useDisposeFixedAsset(tenantId);

  async function handleDispose() {
    try {
      await disposeFixedAsset.mutateAsync({ id: assetId });
      toast.success('Asset disposed');
      setOpen(false);
    } catch (error) {
      toast.error(getApiErrorMessage(error, 'Failed to dispose asset'));
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          Dispose
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Dispose &quot;{description}&quot;?</DialogTitle>
        </DialogHeader>
        <p className="text-sm text-muted-foreground">
          Stops this asset from ever being depreciated again. This does not post a disposal gain/loss
          entry, and its cost stays in the Fixed Assets balance - this only marks it retired.
        </p>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)} disabled={disposeFixedAsset.isPending}>
            Cancel
          </Button>
          <Button variant="destructive" onClick={handleDispose} disabled={disposeFixedAsset.isPending}>
            {disposeFixedAsset.isPending ? 'Disposing…' : 'Dispose'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
