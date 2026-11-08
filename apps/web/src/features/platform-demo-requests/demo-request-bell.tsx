'use client';

import Link from 'next/link';
import { Presentation } from 'lucide-react';
import { useDemoRequests } from './queries';

const POLL_INTERVAL_MS = 30_000;

/**
 * Platform-admin equivalent of NotificationBell — there's no tenant-scoped
 * Notification row to hang this off (platform admins have no tenantId), so
 * it counts unviewed rows directly off the same list query
 * NewDemoRequestWatcher polls, riding along on its interval rather than
 * starting a second one.
 */
export function DemoRequestBell() {
  const { data: demoRequests } = useDemoRequests({ refetchInterval: POLL_INTERVAL_MS });
  const unviewedCount = demoRequests?.filter((request) => !request.viewedAt).length ?? 0;

  return (
    <Link
      href="/platform-admin/demo-requests"
      className="relative inline-flex size-9 items-center justify-center rounded-md hover:bg-accent"
      aria-label={unviewedCount > 0 ? `Demo requests (${unviewedCount} new)` : 'Demo requests'}
    >
      <Presentation className="size-5" />
      {unviewedCount > 0 && (
        <span className="absolute top-1 right-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-medium text-white">
          {unviewedCount > 9 ? '9+' : unviewedCount}
        </span>
      )}
    </Link>
  );
}
