'use client';

import { useSession } from '../../session-provider';
import { AttendancePolicyForm } from '@/features/attendance/attendance-policy-form';
import { PageHeader } from '@/components/page-header';

export default function AttendancePolicyPage() {
  const session = useSession();
  const tenantId = session.tenantId as string;

  return (
    <div className="mx-auto max-w-2xl">
      <PageHeader title="Attendance policy" description="Set the standard daily hours used to calculate overtime." />
      <AttendancePolicyForm tenantId={tenantId} />
    </div>
  );
}
