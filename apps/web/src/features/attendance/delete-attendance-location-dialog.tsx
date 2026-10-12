'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { useDeleteAttendanceLocation } from './queries';
import type { AttendanceLocation } from './types';
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

export function DeleteAttendanceLocationDialog({
  tenantId,
  location,
}: {
  tenantId: string;
  location: AttendanceLocation;
}) {
  const [open, setOpen] = useState(false);
  const deleteLocation = useDeleteAttendanceLocation(tenantId);

  async function handleDelete() {
    try {
      await deleteLocation.mutateAsync(location.id);
      toast.success(`"${location.name}" removed`);
      setOpen(false);
    } catch (error) {
      toast.error(getApiErrorMessage(error, 'Failed to remove location'));
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
          <DialogTitle>Delete &quot;{location.name}&quot;?</DialogTitle>
        </DialogHeader>
        <p className="text-sm text-muted-foreground">
          This removes {location.name} from the tenant&apos;s attendance locations. Historical clock-in/out
          records keep their already-recorded location name and are not affected.
        </p>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)} disabled={deleteLocation.isPending}>
            Cancel
          </Button>
          <Button variant="destructive" onClick={handleDelete} disabled={deleteLocation.isPending}>
            {deleteLocation.isPending ? 'Deleting…' : 'Delete'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
