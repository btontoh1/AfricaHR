'use client';

import { useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { getApiErrorMessage } from '@/lib/api-error';
import { useMarkNotificationRead, useMyNotifications } from './queries';

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
 *
 * Toasts stay open indefinitely (duration: Infinity) rather than
 * auto-dismissing — closed only by the recipient acting on it (the toast's
 * own "Mark read" button) or by it having been read some other way (e.g.
 * from the /notifications page in another tab), which the next poll
 * detects and dismisses automatically via openToastIds.
 */
export function NewNotificationWatcher({ tenantId }: { tenantId: string }) {
  const router = useRouter();
  const { data: notifications } = useMyNotifications(tenantId, { refetchInterval: POLL_INTERVAL_MS });
  const markRead = useMarkNotificationRead(tenantId);
  const seenIds = useRef<Set<string> | null>(null);
  const openToastIds = useRef<Map<string, string | number>>(new Map());

  useEffect(() => {
    if (!notifications) {
      return;
    }

    if (seenIds.current === null) {
      seenIds.current = new Set(notifications.map((n) => n.id));
      return;
    }

    async function handleMarkRead(id: string, toastId: string | number) {
      try {
        await markRead.mutateAsync(id);
        // Don't wait for the next poll to notice — close it the moment the
        // mutation succeeds so there's no up-to-30s lag before it disappears.
        toast.dismiss(toastId);
        openToastIds.current.delete(id);
      } catch (error) {
        toast.error(getApiErrorMessage(error, 'Failed to mark notification as read'));
      }
    }

    for (const notification of notifications) {
      const alreadyOpen = openToastIds.current.get(notification.id);

      if (notification.isRead) {
        // Read some other way (e.g. the /notifications page) since it toasted — close it.
        if (alreadyOpen !== undefined) {
          toast.dismiss(alreadyOpen);
          openToastIds.current.delete(notification.id);
        }
        continue;
      }

      if (notification.status === 'SENT' && !seenIds.current.has(notification.id)) {
        const toastId = toast.info(notification.subject, {
          description: notification.body,
          duration: Infinity,
          action: {
            label: 'Mark read',
            onClick: () => handleMarkRead(notification.id, toastId),
          },
          cancel: {
            label: 'View',
            onClick: () => router.push('/notifications'),
          },
        });
        openToastIds.current.set(notification.id, toastId);
      }
    }

    seenIds.current = new Set(notifications.map((n) => n.id));
  }, [notifications, router, markRead]);

  return null;
}
