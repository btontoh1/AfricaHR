'use client';

import { useSession } from '../../session-provider';
import { LeaveUtilizationReport } from '@/features/reporting/leave-utilization-report';
import { PageHeader } from '@/components/page-header';

export default function LeaveUtilizationReportPage() {
  const session = useSession();
  const tenantId = session.tenantId as string;

  return (
    <div>
      <PageHeader title="Leave utilization" description="Leave taken vs. entitlement by type." />
      <LeaveUtilizationReport tenantId={tenantId} />
    </div>
  );
}
