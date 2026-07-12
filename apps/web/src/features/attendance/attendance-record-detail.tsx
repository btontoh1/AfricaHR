'use client';

import { useAttendanceRecord } from './queries';
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

export function AttendanceRecordDetail({
  tenantId,
  recordId,
}: {
  tenantId: string;
  recordId: string;
}) {
  const { data: record, isLoading, isError, error } = useAttendanceRecord(tenantId, recordId);
  const { data: employee } = useEmployee(tenantId, record?.employeeId ?? '');

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
