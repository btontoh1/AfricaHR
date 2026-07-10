'use client';

import { useSession } from '../../session-provider';
import { AttendancePolicyForm } from '@/features/attendance/attendance-policy-form';

export default function AttendancePolicyPage() {
  const session = useSession();
  const tenantId = session.tenantId as string;

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="mb-6 text-2xl font-semibold">Attendance policy</h1>
      <AttendancePolicyForm tenantId={tenantId} />
    </div>
  );
}
