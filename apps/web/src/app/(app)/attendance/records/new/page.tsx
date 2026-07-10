'use client';

import { useSession } from '../../../session-provider';
import { CreateAttendanceRecordForm } from '@/features/attendance/create-attendance-record-form';

export default function NewAttendanceRecordPage() {
  const session = useSession();
  const tenantId = session.tenantId as string;

  return (
    <div className="mx-auto max-w-2xl">
      <CreateAttendanceRecordForm tenantId={tenantId} />
    </div>
  );
}
