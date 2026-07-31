'use client';

import { useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { useMyNotifications } from './queries';

const POLL_INTERVAL_MS = 30_000;

/**
 * Renders nothing — polls the self-service inbox in the background and
 * pops a toast for any notification that's new since the last poll, from
 * wherever the user currently is in the app (not just the /notifications
 * page itself). Only SENT notifications toast; PENDING/FAILED aren't
 * things the recipient has actually received yet (see canMarkRead in
 * notification-status.ts for the same reasoning applied to "mark read").
 *
 * seenIds starts as null rather than an empty Set specifically to
 * distinguish "haven't loaded yet" from "loaded, nothing was here" — this
 * is what stops every pre-existing notification from toasting all at once
 * the moment the app shell first mounts.
 */
export function NewNotificationWatcher({ tenantId }: { tenantId: string }) {
  const router = useRouter();
  const { data: notifications } = useMyNotifications(tenantId, { refetchInterval: POLL_INTERVAL_MS });
  const seenIds = useRef<Set<string> | null>(null);

  useEffect(() => {
    if (!notifications) {
      return;
    }

    if (seenIds.current === null) {
      seenIds.current = new Set(notifications.map((n) => n.id));
      return;
    }

    for (const notification of notifications) {
      if (notification.status === 'SENT' && !seenIds.current.has(notification.id)) {
        toast.info(notification.subject, {
          description: notification.body,
          action: {
            label: 'View',
            onClick: () => router.push('/notifications'),
          },
        });
      }
    }

    seenIds.current = new Set(notifications.map((n) => n.id));
  }, [notifications, router]);

  return null;
}
