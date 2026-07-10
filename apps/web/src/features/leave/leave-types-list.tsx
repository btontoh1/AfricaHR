'use client';

import { toast } from 'sonner';
import { useLeaveTypes, useUpdateLeaveType } from './queries';
import { getApiErrorMessage } from '@/lib/api-error';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

function ToggleActiveButton({ tenantId, id, isActive }: { tenantId: string; id: string; isActive: boolean }) {
  const updateLeaveType = useUpdateLeaveType(tenantId, id);

  async function handleToggle() {
    try {
      await updateLeaveType.mutateAsync({ isActive: !isActive });
      toast.success(isActive ? 'Leave type deactivated' : 'Leave type activated');
    } catch (error) {
      toast.error(getApiErrorMessage(error, 'Failed to update leave type'));
    }
  }

  return (
    <Button variant="outline" size="sm" onClick={handleToggle} disabled={updateLeaveType.isPending}>
      {isActive ? 'Deactivate' : 'Activate'}
    </Button>
  );
}

export function LeaveTypesList({ tenantId }: { tenantId: string }) {
  const { data: leaveTypes, isLoading, isError, error } = useLeaveTypes(tenantId);

  if (isLoading) {
    return (
      <div className="space-y-2">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
      </div>
    );
  }

  if (isError) {
    return (
      <p className="text-sm text-destructive">
        {getApiErrorMessage(error, 'Failed to load leave types')}
      </p>
    );
  }

  if (!leaveTypes || leaveTypes.length === 0) {
    return <p className="text-sm text-muted-foreground">No leave types yet.</p>;
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Name</TableHead>
          <TableHead>Code</TableHead>
          <TableHead>Days/year</TableHead>
          <TableHead>Paid</TableHead>
          <TableHead>Status</TableHead>
          <TableHead />
        </TableRow>
      </TableHeader>
      <TableBody>
        {leaveTypes.map((leaveType) => (
          <TableRow key={leaveType.id}>
            <TableCell>{leaveType.name}</TableCell>
            <TableCell>{leaveType.code}</TableCell>
            <TableCell>{leaveType.defaultEntitlementDays}</TableCell>
            <TableCell>{leaveType.isPaid ? 'Yes' : 'No'}</TableCell>
            <TableCell>
              <Badge variant={leaveType.isActive ? 'default' : 'secondary'}>
                {leaveType.isActive ? 'Active' : 'Inactive'}
              </Badge>
            </TableCell>
            <TableCell>
              <ToggleActiveButton tenantId={tenantId} id={leaveType.id} isActive={leaveType.isActive} />
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
