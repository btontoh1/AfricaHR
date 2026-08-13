'use client';

import { ExternalLink } from 'lucide-react';
import { getEmbedUrl } from './get-embed-url';
import { EditVideoDialog } from './edit-video-dialog';
import { DeleteVideoDialog } from './delete-video-dialog';
import type { HowItWorksVideo } from './types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export function VideoCard({ video, isAdmin }: { video: HowItWorksVideo; isAdmin: boolean }) {
  const embedUrl = getEmbedUrl(video.videoUrl);

  return (
    <Card className="overflow-hidden">
      <div className="aspect-video bg-muted">
        {embedUrl ? (
          <iframe
            src={embedUrl}
            title={video.title}
            className="size-full"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        ) : (
          <a
            href={video.videoUrl}
            target="_blank"
            rel="noreferrer"
            className="flex size-full flex-col items-center justify-center gap-2 text-sm text-muted-foreground hover:text-foreground"
          >
            <ExternalLink className="size-6" />
            Watch video
          </a>
        )}
      </div>
      <CardHeader className="flex-row items-start justify-between gap-2 space-y-0">
        <div>
          <CardTitle className="text-base">{video.title}</CardTitle>
          {video.category && <p className="mt-1 text-xs text-muted-foreground">{video.category}</p>}
        </div>
        {isAdmin && (
          <div className="flex shrink-0 gap-1">
            <EditVideoDialog video={video} />
            <DeleteVideoDialog video={video} />
          </div>
        )}
      </CardHeader>
      {video.description && (
        <CardContent>
          <p className="text-sm text-muted-foreground">{video.description}</p>
        </CardContent>
      )}
      {!embedUrl && (
        <CardContent className="pt-0">
          <Button variant="outline" size="sm" asChild>
            <a href={video.videoUrl} target="_blank" rel="noreferrer">
              <ExternalLink className="size-4" />
              Open link
            </a>
          </Button>
        </CardContent>
      )}
    </Card>
  );
}
