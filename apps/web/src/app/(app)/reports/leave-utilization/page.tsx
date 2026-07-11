'use client';

import { useSession } from '../../session-provider';
import { LeaveUtilizationReport } from '@/features/reporting/leave-utilization-report';

export default function LeaveUtilizationReportPage() {
  const session = useSession();
  const tenantId = session.tenantId as string;

  return (
    <div>
      <h1 className="mb-6 text-2xl font-semibold">Leave utilization</h1>
      <LeaveUtilizationReport tenantId={tenantId} />
    </div>
  );
}
