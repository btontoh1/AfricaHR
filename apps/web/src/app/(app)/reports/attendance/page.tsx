'use client';

import { useSession } from '../../session-provider';
import { AttendanceReport } from '@/features/reporting/attendance-report';

export default function AttendanceReportPage() {
  const session = useSession();
  const tenantId = session.tenantId as string;

  return (
    <div>
      <h1 className="mb-6 text-2xl font-semibold">Attendance</h1>
      <AttendanceReport tenantId={tenantId} />
    </div>
  );
}
