'use client';

import { useSession } from '../../session-provider';
import { AttendancePolicyForm } from '@/features/attendance/attendance-policy-form';
import { AttendanceLocationsList } from '@/features/attendance/attendance-locations-list';
import { CreateAttendanceLocationDialog } from '@/features/attendance/create-attendance-location-dialog';
import { PageHeader } from '@/components/page-header';

export default function AttendancePolicyPage() {
  const session = useSession();
  const tenantId = session.tenantId as string;

  return (
    <div className="mx-auto max-w-2xl space-y-8">
      <div>
        <PageHeader title="Attendance policy" description="Set the standard daily hours used to calculate overtime." />
        <AttendancePolicyForm tenantId={tenantId} />
      </div>
      <div>
        <PageHeader
          title="Attendance locations"
          description="Work sites employees can clock in/out from. Informational only — a clock-in/out is never blocked by location, it's just labeled with the nearest one."
          action={<CreateAttendanceLocationDialog tenantId={tenantId} />}
        />
        <AttendanceLocationsList tenantId={tenantId} />
      </div>
    </div>
  );
}
