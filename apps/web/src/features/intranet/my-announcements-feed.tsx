'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { Megaphone, Pin } from 'lucide-react';
import {
  useMyAnnouncements,
  useMyAnnouncementAttachmentViewUrl,
  useMarkAnnouncementRead,
} from './announcement-queries';
import { getApiErrorMessage } from '@/lib/api-error';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { EmptyState } from '@/components/empty-state';
import { CardSkeleton } from '@/components/loading-state';
import { ErrorState } from '@/components/error-state';
import { cn } from '@/lib/utils';

export function MyAnnouncementsFeed({ tenantId }: { tenantId: string }) {
  const { data: announcements, isLoading, isError, error } = useMyAnnouncements(tenantId);
  const getViewUrl = useMyAnnouncementAttachmentViewUrl(tenantId);
  const markRead = useMarkAnnouncementRead(tenantId);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  function handleExpand(id: string, isRead: boolean | undefined) {
    const next = expandedId === id ? null : id;
    setExpandedId(next);
    // Opening a post is what "reads" it - no separate acknowledgement step,
    // unlike Policy's explicit "I have read this" button.
    if (next && !isRead) {
      markRead.mutate(id);
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
    return <EmptyState icon={Megaphone} title="No announcements yet" description="Check back soon." />;
  }

  return (
    <div className="space-y-3">
      {announcements.map((announcement) => {
        const isExpanded = expandedId === announcement.id;
        return (
          <button
            key={announcement.id}
            type="button"
            onClick={() => handleExpand(announcement.id, announcement.isRead)}
            className={cn(
              'w-full rounded-lg border p-4 text-left transition-colors',
              !announcement.isRead && 'border-primary/40 bg-primary/5',
            )}
          >
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="flex items-center gap-2">
                {announcement.pinned && (
                  <Badge variant="outline">
                    <Pin className="size-3" /> Pinned
                  </Badge>
                )}
                {!announcement.isRead && <Badge>New</Badge>}
                <p className="font-medium">{announcement.title}</p>
              </div>
              <p className="text-sm text-muted-foreground">
                {new Date(announcement.createdAt).toLocaleDateString()}
              </p>
            </div>
            {isExpanded && (
              <div className="mt-2 space-y-2">
                <p className="whitespace-pre-wrap text-sm">{announcement.body}</p>
                {announcement.attachmentFileName && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={(event) => {
                      event.stopPropagation();
                      handleViewAttachment(announcement.id);
                    }}
                  >
                    View {announcement.attachmentFileName}
                  </Button>
                )}
              </div>
            )}
          </button>
        );
      })}
    </div>
  );
}
