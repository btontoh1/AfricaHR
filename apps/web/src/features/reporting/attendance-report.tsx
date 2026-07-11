'use client';

import { useState } from 'react';
import { useAttendanceReport } from './queries';
import { getDefaultDateRange } from './date-range';
import { OrganizationFilter, ALL_ORGANIZATIONS } from './organization-filter';
import { StatCard } from './stat-card';
import { getApiErrorMessage } from '@/lib/api-error';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';

export function AttendanceReport({ tenantId }: { tenantId: string }) {
  const [organizationId, setOrganizationId] = useState(ALL_ORGANIZATIONS);
  const [{ from, to }, setRange] = useState(getDefaultDateRange());

  const { data: report, isLoading, isError, error } = useAttendanceReport(tenantId, {
    organizationId: organizationId === ALL_ORGANIZATIONS ? undefined : organizationId,
    from,
    to,
  });

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end gap-3">
        <OrganizationFilter tenantId={tenantId} value={organizationId} onChange={setOrganizationId} />
        <div>
          <Label htmlFor="attendance-from">From</Label>
          <Input
            id="attendance-from"
            type="date"
            value={from}
            onChange={(e) => setRange((prev) => ({ ...prev, from: e.target.value }))}
          />
        </div>
        <div>
          <Label htmlFor="attendance-to">To</Label>
          <Input
            id="attendance-to"
            type="date"
            value={to}
            onChange={(e) => setRange((prev) => ({ ...prev, to: e.target.value }))}
          />
        </div>
      </div>

      {isLoading && <Skeleton className="h-32 w-full" />}

      {isError && (
        <p className="text-sm text-destructive">
          {getApiErrorMessage(error, 'Failed to load the attendance report')}
        </p>
      )}

      {report && (
        <div className="grid gap-4 sm:grid-cols-2">
          <StatCard label="Records" value={report.recordCount} />
          <StatCard label="Employees" value={report.employeeCount} />
          <StatCard label="Total hours worked" value={report.totalHoursWorked} />
          <StatCard label="Total overtime hours" value={report.totalOvertimeHours} />
        </div>
      )}
    </div>
  );
}
