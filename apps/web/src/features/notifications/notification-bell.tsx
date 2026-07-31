'use client';

import Link from 'next/link';
import { Bell } from 'lucide-react';
import { useMyNotifications } from './queries';

/**
 * Reads from the same query key NewNotificationWatcher polls, so this
 * doesn't start a second polling loop — React Query shares the cache and
 * refetch across every observer of the same key, so this just rides along
 * on the watcher's interval.
 */
export function NotificationBell({ tenantId }: { tenantId: string }) {
  const { data: notifications } = useMyNotifications(tenantId);
  const unreadCount = notifications?.filter((n) => n.status === 'SENT' && !n.isRead).length ?? 0;

  return (
    <Link
      href="/notifications"
      className="relative inline-flex size-9 items-center justify-center rounded-md hover:bg-accent"
      aria-label={unreadCount > 0 ? `Notifications (${unreadCount} unread)` : 'Notifications'}
    >
      <Bell className="size-5" />
      {unreadCount > 0 && (
        <span className="absolute top-1 right-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-medium text-white">
          {unreadCount > 9 ? '9+' : unreadCount}
        </span>
      )}
    </Link>
  );
}
