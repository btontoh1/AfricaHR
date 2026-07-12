'use client';

import { useSession } from '../../session-provider';
import { CreateNotificationTemplateForm } from '@/features/notifications/create-notification-template-form';
import { NotificationTemplatesList } from '@/features/notifications/notification-templates-list';
import { PageHeader } from '@/components/page-header';

export default function NotificationTemplatesPage() {
  const session = useSession();
  const tenantId = session.tenantId as string;

  return (
    <div>
      <PageHeader title="Notification templates" description="Reusable message templates for common notifications." />
      <div className="space-y-6">
        <CreateNotificationTemplateForm tenantId={tenantId} />
        <NotificationTemplatesList tenantId={tenantId} />
      </div>
    </div>
  );
}
