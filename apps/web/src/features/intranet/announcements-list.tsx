'use client';

import { toast } from 'sonner';
import { Megaphone, Pin, PinOff } from 'lucide-react';
import { useAnnouncements, useSetAnnouncementPinned, useAnnouncementAttachmentViewUrl } from './announcement-queries';
import { AudienceBadge } from './audience-badge';
import { getApiErrorMessage } from '@/lib/api-error';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { EmptyState } from '@/components/empty-state';
import { CardSkeleton } from '@/components/loading-state';
import { ErrorState } from '@/components/error-state';

export function AnnouncementsList({ tenantId }: { tenantId: string }) {
  const { data: announcements, isLoading, isError, error } = useAnnouncements(tenantId);
  const setPinned = useSetAnnouncementPinned(tenantId);
  const getViewUrl = useAnnouncementAttachmentViewUrl(tenantId);

  async function handleTogglePin(id: string, pinned: boolean) {
    try {
      await setPinned.mutateAsync({ id, pinned: !pinned });
    } catch (pinError) {
      toast.error(getApiErrorMessage(pinError, 'Failed to update pin'));
    }
  }

  async function handleViewAttachment(id: string) {
    try {
      const viewUrl = await getViewUrl.mutateAsync(id);
      window.open(viewUrl, '_blank', 'noopener,noreferrer');
    } catch (viewError) {
      toast.error(getApiErrorMessage(viewError, 'Failed to open attachment'));
    }
  }

  if (isLoading) {
    return <CardSkeleton />;
  }

  if (isError) {
    return <ErrorState message={getApiErrorMessage(error, 'Failed to load announcements')} />;
  }

  if (!announcements || announcements.length === 0) {
    return (
      <EmptyState icon={Megaphone} title="No announcements yet" description="Post your first update above." />
    );
  }

  return (
    <div className="space-y-3">
      {announcements.map((announcement) => (
        <div key={announcement.id} className="space-y-2 rounded-lg border p-4">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                {announcement.pinned && (
                  <Badge variant="outline">
                    <Pin className="size-3" /> Pinned
                  </Badge>
                )}
                <p className="font-medium">{announcement.title}</p>
              </div>
              <p className="text-sm text-muted-foreground">
                {new Date(announcement.createdAt).toLocaleString()}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <AudienceBadge tenantId={tenantId} item={announcement} />
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleTogglePin(announcement.id, announcement.pinned)}
                disabled={setPinned.isPending}
              >
                {announcement.pinned ? <PinOff className="size-4" /> : <Pin className="size-4" />}
                {announcement.pinned ? 'Unpin' : 'Pin'}
              </Button>
            </div>
          </div>
          <p className="whitespace-pre-wrap text-sm">{announcement.body}</p>
          {announcement.attachmentFileName && (
            <Button size="sm" variant="outline" onClick={() => handleViewAttachment(announcement.id)}>
              View {announcement.attachmentFileName}
            </Button>
          )}
        </div>
      ))}
    </div>
  );
}
