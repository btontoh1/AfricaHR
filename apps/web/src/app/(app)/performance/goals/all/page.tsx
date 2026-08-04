'use client';

import { useSession } from '../../../session-provider';
import { AllGoalsAdminList } from '@/features/performance/all-goals-admin-list';
import { PageHeader } from '@/components/page-header';

export default function AllGoalsAdminPage() {
  const session = useSession();
  const tenantId = session.tenantId as string;

  return (
    <div>
      <PageHeader title="All goals" description="Review and update employee goals across the organization." />
      <div className="space-y-6">
        <AllGoalsAdminList tenantId={tenantId} />
      </div>
    </div>
  );
}
