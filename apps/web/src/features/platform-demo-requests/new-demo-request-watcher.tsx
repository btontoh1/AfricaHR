'use client';

import { useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { useDemoRequests } from './queries';

const POLL_INTERVAL_MS = 30_000;

/**
 * Renders nothing — polls the platform-admin demo request list in the
 * background and pops a toast for any submission that's new since the last
 * poll, mirroring NewNotificationWatcher's pattern for tenant-scoped
 * Notification rows. DemoRequest has no per-recipient "read" state to key
 * off (viewedAt is a single shared timestamp, cleared for every platform
 * admin the moment any one of them opens the list — see
 * DemoRequestService.markAllViewed), so this tracks "seen this session" by
 * id locally instead, same as the pre-existing seenIds approach.
 */
export function NewDemoRequestWatcher() {
  const router = useRouter();
  const { data: demoRequests } = useDemoRequests({ refetchInterval: POLL_INTERVAL_MS });
  const seenIds = useRef<Set<string> | null>(null);

  useEffect(() => {
    if (!demoRequests) {
      return;
    }

    if (seenIds.current === null) {
      seenIds.current = new Set(demoRequests.map((request) => request.id));
      return;
    }

    for (const request of demoRequests) {
      if (!seenIds.current.has(request.id)) {
        toast.info('New demo request', {
          description: `${request.fullName} · ${request.organizationName}`,
          duration: Infinity,
          action: {
            label: 'View',
            onClick: () => router.push('/platform-admin/demo-requests'),
          },
        });
      }
    }

    seenIds.current = new Set(demoRequests.map((request) => request.id));
  }, [demoRequests, router]);

  return null;
}
