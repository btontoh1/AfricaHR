'use client';

import { useState } from 'react';
import { History } from 'lucide-react';
import { useMyAttendance } from './queries';
import { getApiErrorMessage } from '@/lib/api-error';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { TableCard } from '@/components/table-card';
import { EmptyState } from '@/components/empty-state';
import { TableSkeleton } from '@/components/loading-state';
import { ErrorState } from '@/components/error-state';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

function formatTime(value?: string | null) {
  return value ? new Date(value).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '—';
}

export function AttendanceHistoryTable({ tenantId }: { tenantId: string }) {
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const { data: records, isLoading, isError, error } = useMyAttendance(tenantId, {
    from: from || undefined,
    to: to || undefined,
  });

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end gap-3">
        <div>
          <Label htmlFor="history-from">From</Label>
          <Input id="history-from" type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
        </div>
        <div>
          <Label htmlFor="history-to">To</Label>
          <Input id="history-to" type="date" value={to} onChange={(e) => setTo(e.target.value)} />
        </div>
      </div>

      {isLoading && <TableSkeleton />}

      {isError && <ErrorState message={getApiErrorMessage(error, 'Failed to load attendance history')} />}

      {records && records.length === 0 && (
        <EmptyState icon={History} title="No attendance records yet" />
      )}

      {records && records.length > 0 && (
        <TableCard>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Clock in</TableHead>
                <TableHead>Clock out</TableHead>
                <TableHead>Hours worked</TableHead>
                <TableHead>Overtime</TableHead>
                <TableHead>Notes</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {records.map((record) => (
                <TableRow key={record.id}>
                  <TableCell>{record.date.slice(0, 10)}</TableCell>
                  <TableCell>{formatTime(record.clockIn)}</TableCell>
                  <TableCell>{formatTime(record.clockOut)}</TableCell>
                  <TableCell>{record.hoursWorked ?? '—'}</TableCell>
                  <TableCell>{record.overtimeHours ?? '—'}</TableCell>
                  <TableCell className="text-muted-foreground">{record.notes ?? '—'}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableCard>
      )}
    </div>
  );
}
