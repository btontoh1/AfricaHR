'use client';

import { useSession } from '../session-provider';
import { ClockInOutCard } from '@/features/attendance/clock-in-out-card';
import { AttendanceHistoryTable } from '@/features/attendance/attendance-history-table';

export default function AttendancePage() {
  const session = useSession();
  const tenantId = session.tenantId as string;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">My attendance</h1>
      <ClockInOutCard tenantId={tenantId} />
      <AttendanceHistoryTable tenantId={tenantId} />
    </div>
  );
}
