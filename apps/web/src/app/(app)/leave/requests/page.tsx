'use client';

import { useSession } from '../../session-provider';
import { LeaveApprovalQueue } from '@/features/leave/leave-approval-queue';

export default function LeaveRequestsPage() {
  const session = useSession();
  const tenantId = session.tenantId as string;

  return (
    <div>
      <h1 className="mb-6 text-2xl font-semibold">Leave requests</h1>
      <LeaveApprovalQueue tenantId={tenantId} />
    </div>
  );
}
