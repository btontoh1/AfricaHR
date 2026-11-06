'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { Trash2 } from 'lucide-react';
import { useDeleteHowItWorksVideo } from './queries';
import type { HowItWorksVideo } from './types';
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

export function DeleteVideoDialog({ video }: { video: HowItWorksVideo }) {
  const [open, setOpen] = useState(false);
  const deleteVideo = useDeleteHowItWorksVideo();

  async function handleDelete() {
    try {
      await deleteVideo.mutateAsync(video.id);
      toast.success(`"${video.title}" removed`);
      setOpen(false);
    } catch (error) {
      toast.error(getApiErrorMessage(error, 'Failed to remove video'));
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="icon" aria-label="Remove video">
          <Trash2 className="size-4" />
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Remove &quot;{video.title}&quot;?</DialogTitle>
        </DialogHeader>
        <p className="text-sm text-muted-foreground">This removes the video from everyone&apos;s How it works page.</p>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)} disabled={deleteVideo.isPending}>
            Cancel
          </Button>
          <Button variant="destructive" onClick={handleDelete} disabled={deleteVideo.isPending}>
            {deleteVideo.isPending ? 'Removing…' : 'Remove'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
