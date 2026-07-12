'use client';

import { useSession } from '../../session-provider';
import { AttendanceRecordsList } from '@/features/attendance/attendance-records-list';
import { PageHeader } from '@/components/page-header';

export default function AttendanceRecordsPage() {
  const session = useSession();
  const tenantId = session.tenantId as string;

  return (
    <div>
      <PageHeader title="Attendance records" description="Browse and correct attendance records across your team." />
      <AttendanceRecordsList tenantId={tenantId} />
    </div>
  );
}
