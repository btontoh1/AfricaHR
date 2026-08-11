'use client';

import { Clock } from 'lucide-react';
import { toast } from 'sonner';
import { useClockIn, useClockOut, useMyAttendance } from './queries';
import { getApiErrorMessage, isNoEmployeeLinkedError } from '@/lib/api-error';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CardSkeleton } from '@/components/loading-state';
import { EmployeeLinkRequiredState } from '@/components/employee-link-required-state';

export function ClockInOutCard({ tenantId }: { tenantId: string }) {
  const { data: records, isLoading, isError, error } = useMyAttendance(tenantId);
  const clockIn = useClockIn(tenantId);
  const clockOut = useClockOut(tenantId);

  const openRecord = records?.find((record) => record.clockIn && !record.clockOut);

  async function handleClockIn() {
    try {
      const record = await clockIn.mutateAsync();
      if (record?.clockInOutsideGeofence) {
        toast.warning('Clocked in — you appear to be outside the work-site location');
      } else {
        toast.success('Clocked in');
      }
    } catch (error) {
      toast.error(getApiErrorMessage(error, 'Failed to clock in'));
    }
  }

  async function handleClockOut() {
    try {
      const record = await clockOut.mutateAsync();
      if (record?.clockOutOutsideGeofence) {
        toast.warning('Clocked out — you appear to be outside the work-site location');
      } else {
        toast.success('Clocked out');
      }
    } catch (error) {
      toast.error(getApiErrorMessage(error, 'Failed to clock out'));
    }
  }

  if (isLoading) {
    return <CardSkeleton />;
  }

  if (isError && isNoEmployeeLinkedError(error)) {
    return <EmployeeLinkRequiredState />;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="size-4 text-muted-foreground" />
          {openRecord ? 'Currently clocked in' : 'Not clocked in'}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {openRecord?.clockIn && (
          <p className="text-sm text-muted-foreground">
            Since {new Date(openRecord.clockIn).toLocaleString()}
          </p>
        )}
        {openRecord ? (
          <Button onClick={handleClockOut} disabled={clockOut.isPending}>
            {clockOut.isPending ? 'Clocking out…' : 'Clock out'}
          </Button>
        ) : (
          <Button onClick={handleClockIn} disabled={clockIn.isPending}>
            {clockIn.isPending ? 'Clocking in…' : 'Clock in'}
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
