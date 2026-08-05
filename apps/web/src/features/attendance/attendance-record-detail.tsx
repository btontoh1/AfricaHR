'use client';

import { useAttendancePolicy, useAttendanceRecord } from './queries';
import { useEmployee } from '@/features/employees/queries';
import { UpdateAttendanceRecordForm } from './update-attendance-record-form';
import { getApiErrorMessage } from '@/lib/api-error';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CardSkeleton } from '@/components/loading-state';
import { ErrorState } from '@/components/error-state';
import { PageHeader } from '@/components/page-header';

function Field({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="text-sm">{value ?? '—'}</div>
    </div>
  );
}

function formatLocation(
  latitude?: string | null,
  longitude?: string | null,
  outsideGeofence?: boolean | null,
  distanceMeters?: number | null,
  locationName?: string | null,
): string | undefined {
  if (!latitude || !longitude) {
    return undefined;
  }
  const coordinates = `${Number(latitude).toFixed(5)}, ${Number(longitude).toFixed(5)}`;
  const prefix = locationName ? `${locationName} — ` : '';
  if (outsideGeofence == null) {
    return `${prefix}${coordinates}`;
  }
  return outsideGeofence
    ? `${prefix}${coordinates} — ${distanceMeters}m outside the work-site geofence`
    : `${prefix}${coordinates} — within the work-site geofence`;
}

export function AttendanceRecordDetail({
  tenantId,
  recordId,
}: {
  tenantId: string;
  recordId: string;
}) {
  const { data: record, isLoading, isError, error } = useAttendanceRecord(tenantId, recordId);
  const { data: employee } = useEmployee(tenantId, record?.employeeId ?? '');
  const { data: policy } = useAttendancePolicy(tenantId);

  if (isLoading) {
    return <CardSkeleton />;
  }

  if (isError || !record) {
    return <ErrorState message={getApiErrorMessage(error, 'Failed to load attendance record')} />;
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={record.date.slice(0, 10)}
        description={employee ? `${employee.firstName} ${employee.lastName}` : record.employeeId}
      />

      <Card>
        <CardHeader>
          <CardTitle>Details</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-3">
          <Field label="Clock in" value={record.clockIn ? new Date(record.clockIn).toLocaleString() : undefined} />
          <Field label="Clock out" value={record.clockOut ? new Date(record.clockOut).toLocaleString() : undefined} />
          <Field label="Hours worked" value={record.hoursWorked} />
          <Field label="Overtime" value={record.overtimeHours} />
          <Field label="Notes" value={record.notes} />
          <Field label="Clock-in location" value={formatLocation(record.clockInLatitude, record.clockInLongitude, record.clockInOutsideGeofence, record.clockInDistanceMeters, policy?.geofenceLocationName)} />
          <Field label="Clock-out location" value={formatLocation(record.clockOutLatitude, record.clockOutLongitude, record.clockOutOutsideGeofence, record.clockOutDistanceMeters, policy?.geofenceLocationName)} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Correct this record</CardTitle>
        </CardHeader>
        <CardContent>
          <UpdateAttendanceRecordForm tenantId={tenantId} record={record} />
        </CardContent>
      </Card>
    </div>
  );
}
