'use client';

import { useSession } from '../../session-provider';
import { AttendanceReport } from '@/features/reporting/attendance-report';
import { PageHeader } from '@/components/page-header';

export default function AttendanceReportPage() {
  const session = useSession();
  const tenantId = session.tenantId as string;

  return (
    <div>
      <PageHeader title="Attendance" description="Attendance and overtime trends across your organization." />
      <AttendanceReport tenantId={tenantId} />
    </div>
  );
}
