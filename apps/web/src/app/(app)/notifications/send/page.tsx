'use client';

import { useSession } from '../../session-provider';
import { SendNotificationForm } from '@/features/notifications/send-notification-form';
import { SendFromTemplateForm } from '@/features/notifications/send-from-template-form';
import { AllNotificationsList } from '@/features/notifications/all-notifications-list';

export default function SendNotificationPage() {
  const session = useSession();
  const tenantId = session.tenantId as string;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Send notification</h1>
      <SendNotificationForm tenantId={tenantId} />
      <SendFromTemplateForm tenantId={tenantId} />
      <AllNotificationsList tenantId={tenantId} />
    </div>
  );
}
