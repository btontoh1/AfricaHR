'use client';

import { useSession } from '../session-provider';
import { MyNotificationsList } from '@/features/notifications/my-notifications-list';

export default function NotificationsPage() {
  const session = useSession();
  const tenantId = session.tenantId as string;

  return (
    <div>
      <h1 className="mb-6 text-2xl font-semibold">Notifications</h1>
      <MyNotificationsList tenantId={tenantId} />
    </div>
  );
}
