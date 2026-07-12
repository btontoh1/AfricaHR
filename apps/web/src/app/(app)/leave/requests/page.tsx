'use client';

import { useSession } from '../../session-provider';
import { LeaveApprovalQueue } from '@/features/leave/leave-approval-queue';
import { PageHeader } from '@/components/page-header';

export default function LeaveRequestsPage() {
  const session = useSession();
  const tenantId = session.tenantId as string;

  return (
    <div>
      <PageHeader title="Leave requests" description="Review and action your team's leave requests." />
      <LeaveApprovalQueue tenantId={tenantId} />
    </div>
  );
}
