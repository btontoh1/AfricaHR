'use client';

import { useSession } from '../../session-provider';
import { AttendanceRecordsList } from '@/features/attendance/attendance-records-list';

export default function AttendanceRecordsPage() {
  const session = useSession();
  const tenantId = session.tenantId as string;

  return (
    <div>
      <h1 className="mb-6 text-2xl font-semibold">Attendance records</h1>
      <AttendanceRecordsList tenantId={tenantId} />
    </div>
  );
}
