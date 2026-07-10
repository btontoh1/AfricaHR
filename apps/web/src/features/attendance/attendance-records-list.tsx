'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useAttendanceRecords } from './queries';
import { useEmployees } from '@/features/employees/queries';
import { getApiErrorMessage } from '@/lib/api-error';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
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
          <Link href="/attendance/records/new">Add record</Link>
        </Button>
      </div>

      {isLoading && (
        <div className="space-y-2">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
        </div>
      )}

      {isError && (
        <p className="text-sm text-destructive">
          {getApiErrorMessage(error, 'Failed to load attendance records')}
        </p>
      )}

      {records && records.length === 0 && (
        <p className="text-sm text-muted-foreground">No attendance records match this filter.</p>
      )}

      {records && records.length > 0 && (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Employee</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Clock in</TableHead>
              <TableHead>Clock out</TableHead>
              <TableHead>Hours worked</TableHead>
              <TableHead>Overtime</TableHead>
              <TableHead />
            </TableRow>
          </TableHeader>
          <TableBody>
            {records.map((record) => (
              <TableRow key={record.id}>
                <TableCell>{employeeName(record.employeeId)}</TableCell>
                <TableCell>{record.date.slice(0, 10)}</TableCell>
                <TableCell>{formatTime(record.clockIn)}</TableCell>
                <TableCell>{formatTime(record.clockOut)}</TableCell>
                <TableCell>{record.hoursWorked ?? '—'}</TableCell>
                <TableCell>{record.overtimeHours ?? '—'}</TableCell>
                <TableCell>
                  <Link href={`/attendance/records/${record.id}`} className="text-sm underline">
                    View
                  </Link>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  );
}
