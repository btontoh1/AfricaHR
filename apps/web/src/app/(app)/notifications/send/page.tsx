'use client';

import { useSession } from '../../session-provider';
import { SendNotificationForm } from '@/features/notifications/send-notification-form';
import { SendFromTemplateForm } from '@/features/notifications/send-from-template-form';
import { AllNotificationsList } from '@/features/notifications/all-notifications-list';
import { PageHeader } from '@/components/page-header';

export default function SendNotificationPage() {
  const session = useSession();
  const tenantId = session.tenantId as string;

  return (
    <div>
      <PageHeader title="Send notification" description="Send a one-off or templated notification to your team." />
      <div className="space-y-6">
        <SendNotificationForm tenantId={tenantId} />
        <SendFromTemplateForm tenantId={tenantId} />
        <AllNotificationsList tenantId={tenantId} />
      </div>
    </div>
  );
}
