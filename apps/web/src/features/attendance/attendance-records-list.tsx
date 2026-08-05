'use client';

import { useState } from 'react';
import Link from 'next/link';
import { CalendarDays, MapPinOff, Plus } from 'lucide-react';
import { useAttendancePolicy, useAttendanceRecords } from './queries';
import { useEmployees } from '@/features/employees/queries';
import { getApiErrorMessage } from '@/lib/api-error';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { TableCard } from '@/components/table-card';
import { EmptyState } from '@/components/empty-state';
import { TableSkeleton } from '@/components/loading-state';
import { ErrorState } from '@/components/error-state';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

const ALL_EMPLOYEES = 'ALL';

function formatTime(value?: string | null) {
  return value ? new Date(value).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '—';
}

export function AttendanceRecordsList({ tenantId }: { tenantId: string }) {
  const [employeeId, setEmployeeId] = useState(ALL_EMPLOYEES);
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');

  const { data: employees } = useEmployees(tenantId);
  // isError intentionally unused - no policy configured yet just means no
  // location name to show, not a page-level failure.
  const { data: policy } = useAttendancePolicy(tenantId);
  const { data: records, isLoading, isError, error } = useAttendanceRecords(tenantId, {
    employeeId: employeeId === ALL_EMPLOYEES ? undefined : employeeId,
    from: from || undefined,
    to: to || undefined,
  });

  const employeeName = (id: string) => {
    const employee = employees?.find((e) => e.id === id);
    return employee ? `${employee.firstName} ${employee.lastName}` : id;
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end gap-3">
        <div>
          <Label>Employee</Label>
          <Select value={employeeId} onValueChange={setEmployeeId}>
            <SelectTrigger className="w-56">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL_EMPLOYEES}>All employees</SelectItem>
              {employees?.map((employee) => (
                <SelectItem key={employee.id} value={employee.id}>
                  {employee.firstName} {employee.lastName}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label htmlFor="records-from">From</Label>
          <Input id="records-from" type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
        </div>
        <div>
          <Label htmlFor="records-to">To</Label>
          <Input id="records-to" type="date" value={to} onChange={(e) => setTo(e.target.value)} />
        </div>
        <Button asChild className="ml-auto">
          <Link href="/attendance/records/new">
            <Plus className="size-4" />
            Add record
          </Link>
        </Button>
      </div>

      {isLoading && <TableSkeleton />}

      {isError && <ErrorState message={getApiErrorMessage(error, 'Failed to load attendance records')} />}

      {records && records.length === 0 && (
        <EmptyState icon={CalendarDays} title="No attendance records match this filter" />
      )}

      {records && records.length > 0 && (
        <TableCard>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Employee</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Clock in</TableHead>
                <TableHead>Clock out</TableHead>
                <TableHead>Hours worked</TableHead>
                <TableHead>Overtime</TableHead>
                <TableHead>Location</TableHead>
                <TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              {records.map((record) => {
                const outsideGeofence = record.clockInOutsideGeofence || record.clockOutOutsideGeofence;
                return (
                  <TableRow key={record.id}>
                    <TableCell className="font-medium">{employeeName(record.employeeId)}</TableCell>
                    <TableCell>{record.date.slice(0, 10)}</TableCell>
                    <TableCell>{formatTime(record.clockIn)}</TableCell>
                    <TableCell>{formatTime(record.clockOut)}</TableCell>
                    <TableCell>{record.hoursWorked ?? '—'}</TableCell>
                    <TableCell>{record.overtimeHours ?? '—'}</TableCell>
                    <TableCell>
                      <div className="flex flex-col gap-0.5">
                        {policy?.geofenceLocationName && (
                          <span className="text-sm">{policy.geofenceLocationName}</span>
                        )}
                        {outsideGeofence && (
                          <span className="inline-flex items-center gap-1 text-sm text-amber-600 dark:text-amber-500">
                            <MapPinOff className="size-3.5" />
                            Outside geofence
                          </span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Link href={`/attendance/records/${record.id}`} className="text-sm text-primary hover:underline">
                        View
                      </Link>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </TableCard>
      )}
    </div>
  );
}
