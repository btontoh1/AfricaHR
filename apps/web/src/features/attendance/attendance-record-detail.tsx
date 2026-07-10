'use client';

import { useAttendanceRecord } from './queries';
import { useEmployee } from '@/features/employees/queries';
import { UpdateAttendanceRecordForm } from './update-attendance-record-form';
import { getApiErrorMessage } from '@/lib/api-error';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

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
    return (
      <div className="space-y-2">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-32 w-full" />
      </div>
    );
  }

  if (isError || !record) {
    return (
      <p className="text-sm text-destructive">
        {getApiErrorMessage(error, 'Failed to load attendance record')}
      </p>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">{record.date.slice(0, 10)}</h1>
        <p className="text-sm text-muted-foreground">
          {employee ? `${employee.firstName} ${employee.lastName}` : record.employeeId}
        </p>
      </div>

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
