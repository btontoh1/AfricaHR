'use client';

import { useSession } from '../../session-provider';
import { CreateNotificationTemplateForm } from '@/features/notifications/create-notification-template-form';
import { NotificationTemplatesList } from '@/features/notifications/notification-templates-list';

export default function NotificationTemplatesPage() {
  const session = useSession();
  const tenantId = session.tenantId as string;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Notification templates</h1>
      <CreateNotificationTemplateForm tenantId={tenantId} />
      <NotificationTemplatesList tenantId={tenantId} />
    </div>
  );
}
