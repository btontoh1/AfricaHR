'use client';

import { BroadcastForm } from '@/features/platform-broadcast/broadcast-form';
import { PageHeader } from '@/components/page-header';

export default function PlatformAdminBroadcastPage() {
  return (
    <div>
      <PageHeader title="Broadcast" description="Email and notify every tenant's admin at once." />
      <BroadcastForm />
    </div>
  );
}
