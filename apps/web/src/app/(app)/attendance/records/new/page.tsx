'use client';

import { useSession } from '../../../session-provider';
import { CreateAttendanceRecordForm } from '@/features/attendance/create-attendance-record-form';
import { PageHeader } from '@/components/page-header';

export default function NewAttendanceRecordPage() {
  const session = useSession();
  const tenantId = session.tenantId as string;

  return (
    <div className="mx-auto max-w-2xl">
      <PageHeader title="Add attendance record" description="Manually add a clock-in/out record for an employee." />
      <CreateAttendanceRecordForm tenantId={tenantId} />
    </div>
  );
}
