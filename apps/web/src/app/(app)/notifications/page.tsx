'use client';

import { useSession } from '../session-provider';
import { MyNotificationsList } from '@/features/notifications/my-notifications-list';
import { PageHeader } from '@/components/page-header';

export default function NotificationsPage() {
  const session = useSession();
  const tenantId = session.tenantId as string;

  return (
    <div>
      <PageHeader title="Notifications" description="Your recent notifications." />
      <MyNotificationsList tenantId={tenantId} />
    </div>
  );
}
