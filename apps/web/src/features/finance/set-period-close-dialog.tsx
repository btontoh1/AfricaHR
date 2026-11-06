'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { useSetPeriodClose } from './queries';
import { getApiErrorMessage } from '@/lib/api-error';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export function SetPeriodCloseDialog({
  tenantId,
  organizationId,
  organizationName,
  currentClosedThrough,
}: {
  tenantId: string;
  organizationId: string;
  organizationName: string;
  currentClosedThrough: string | null | undefined;
}) {
  const [open, setOpen] = useState(false);
  const [closedThrough, setClosedThrough] = useState(currentClosedThrough?.slice(0, 10) ?? '');
  const setPeriodClose = useSetPeriodClose(tenantId);

  async function handleSubmit() {
    if (!closedThrough) {
      return;
    }
    try {
      await setPeriodClose.mutateAsync({ organizationId, closedThrough });
      toast.success(`${organizationName}'s books closed through ${closedThrough}`);
      setOpen(false);
    } catch (error) {
      toast.error(getApiErrorMessage(error, 'Failed to close the period'));
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (next) {
          setClosedThrough(currentClosedThrough?.slice(0, 10) ?? '');
        }
        setOpen(next);
      }}
    >
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          {currentClosedThrough ? 'Extend close' : 'Close period'}
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Close {organizationName}&apos;s books through…</DialogTitle>
          <DialogDescription>
            Manual journal entries dated on or before this date can no longer be posted or voided. This
            only ever moves forward - you can extend the close date later, but not move it earlier.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-2">
          <Label htmlFor="closed-through">Closed through</Label>
          <Input
            id="closed-through"
            type="date"
            value={closedThrough}
            onChange={(e) => setClosedThrough(e.target.value)}
          />
        </div>
        <DialogFooter>
          <Button onClick={handleSubmit} disabled={!closedThrough || setPeriodClose.isPending}>
            {setPeriodClose.isPending ? 'Closing…' : 'Confirm'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
