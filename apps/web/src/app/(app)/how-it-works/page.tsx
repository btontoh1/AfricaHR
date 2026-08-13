'use client';

import { PlayCircle } from 'lucide-react';
import { useSession } from '../session-provider';
import { useHowItWorksVideos } from '@/features/how-it-works/queries';
import { CreateVideoDialog } from '@/features/how-it-works/create-video-dialog';
import { VideoCard } from '@/features/how-it-works/video-card';
import { getApiErrorMessage } from '@/lib/api-error';
import { PageHeader } from '@/components/page-header';
import { EmptyState } from '@/components/empty-state';
import { CardSkeleton } from '@/components/loading-state';
import { ErrorState } from '@/components/error-state';
import type { HowItWorksVideo } from '@/features/how-it-works/types';

const UNCATEGORIZED = 'More';

function groupByCategory(videos: HowItWorksVideo[]): [string, HowItWorksVideo[]][] {
  const groups = new Map<string, HowItWorksVideo[]>();
  for (const video of videos) {
    const key = video.category || UNCATEGORIZED;
    const group = groups.get(key);
    if (group) {
      group.push(video);
    } else {
      groups.set(key, [video]);
    }
  }
  // Push the catch-all "More" bucket to the end regardless of where it
  // first appeared in sortOrder, so uncategorized videos don't split up an
  // otherwise-contiguous set of named categories.
  return [...groups.entries()].sort(([a], [b]) => {
    if (a === UNCATEGORIZED) return 1;
    if (b === UNCATEGORIZED) return -1;
    return 0;
  });
}

export default function HowItWorksPage() {
  const session = useSession();
  const isAdmin = session.role === 'PLATFORM_ADMIN';
  const { data: videos, isLoading, isError, error } = useHowItWorksVideos();

  return (
    <div>
      <PageHeader
        title="How it works"
        description="Video walkthroughs of every part of the application."
        action={isAdmin ? <CreateVideoDialog /> : undefined}
      />

      {isLoading && <CardSkeleton />}

      {isError && <ErrorState message={getApiErrorMessage(error, 'Failed to load videos')} />}

      {videos && videos.length === 0 && (
        <EmptyState
          icon={PlayCircle}
          title="No tutorials yet"
          description={
            isAdmin ? 'Add your first video above.' : 'Check back soon - tutorials are on their way.'
          }
        />
      )}

      {videos && videos.length > 0 && (
        <div className="space-y-8">
          {groupByCategory(videos).map(([category, categoryVideos]) => (
            <div key={category}>
              <h2 className="mb-3 text-sm font-medium text-muted-foreground">{category}</h2>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {categoryVideos.map((video) => (
                  <VideoCard key={video.id} video={video} isAdmin={isAdmin} />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
