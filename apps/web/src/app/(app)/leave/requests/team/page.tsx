'use client';

import { useSession } from '../../../session-provider';
import { TeamLeaveRequestsList } from '@/features/leave/team-leave-requests-list';
import { PageHeader } from '@/components/page-header';

export default function TeamLeaveRequestsPage() {
  const session = useSession();
  const tenantId = session.tenantId as string;

  return (
    <div>
      <PageHeader title="Team leave requests" description="Approve or reject leave for your direct reports." />
      <TeamLeaveRequestsList tenantId={tenantId} />
    </div>
  );
}
