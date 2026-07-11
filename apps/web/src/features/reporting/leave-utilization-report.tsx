'use client';

import { useState } from 'react';
import { useLeaveUtilizationReport } from './queries';
import { OrganizationFilter, ALL_ORGANIZATIONS } from './organization-filter';
import { useLeaveTypes } from '@/features/leave/queries';
import { getApiErrorMessage } from '@/lib/api-error';
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

const ALL_LEAVE_TYPES = 'ALL';

export function LeaveUtilizationReport({ tenantId }: { tenantId: string }) {
  const [organizationId, setOrganizationId] = useState(ALL_ORGANIZATIONS);
  const [leaveTypeId, setLeaveTypeId] = useState(ALL_LEAVE_TYPES);
  const [year, setYear] = useState(String(new Date().getFullYear()));

  const { data: leaveTypes } = useLeaveTypes(tenantId);
  const { data: entries, isLoading, isError, error } = useLeaveUtilizationReport(tenantId, {
    organizationId: organizationId === ALL_ORGANIZATIONS ? undefined : organizationId,
    leaveTypeId: leaveTypeId === ALL_LEAVE_TYPES ? undefined : leaveTypeId,
    year,
  });

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end gap-3">
        <OrganizationFilter tenantId={tenantId} value={organizationId} onChange={setOrganizationId} />
        <Select value={leaveTypeId} onValueChange={setLeaveTypeId}>
          <SelectTrigger className="w-56">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL_LEAVE_TYPES}>All leave types</SelectItem>
            {leaveTypes?.map((leaveType) => (
              <SelectItem key={leaveType.id} value={leaveType.id}>
                {leaveType.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <div>
          <Label htmlFor="leave-utilization-year">Year</Label>
          <Input
            id="leave-utilization-year"
            type="number"
            className="w-28"
            value={year}
            onChange={(e) => setYear(e.target.value)}
          />
        </div>
      </div>

      {isLoading && <Skeleton className="h-32 w-full" />}

      {isError && (
        <p className="text-sm text-destructive">
          {getApiErrorMessage(error, 'Failed to load the leave utilization report')}
        </p>
      )}

      {entries && entries.length === 0 && (
        <p className="text-sm text-muted-foreground">No leave data for this filter.</p>
      )}

      {entries && entries.length > 0 && (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Leave type</TableHead>
              <TableHead>Entitled days</TableHead>
              <TableHead>Used days</TableHead>
              <TableHead>Utilization</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {entries.map((entry) => (
              <TableRow key={entry.leaveTypeId}>
                <TableCell>{entry.leaveTypeName}</TableCell>
                <TableCell>{entry.totalEntitledDays}</TableCell>
                <TableCell>{entry.totalUsedDays}</TableCell>
                <TableCell>{entry.utilizationPercent}%</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  );
}
