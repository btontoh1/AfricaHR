'use client';

import { useSession } from '../session-provider';
import { ClockInOutCard } from '@/features/attendance/clock-in-out-card';
import { AttendanceHistoryTable } from '@/features/attendance/attendance-history-table';
import { PageHeader } from '@/components/page-header';

export default function AttendancePage() {
  const session = useSession();
  const tenantId = session.tenantId as string;

  return (
    <div className="space-y-6">
      <PageHeader title="My attendance" description="Track your clock-in/out times and view your history." />
      <ClockInOutCard tenantId={tenantId} />
      <AttendanceHistoryTable tenantId={tenantId} />
    </div>
  );
}
