'use client';

import { toast } from 'sonner';
import { useCancelMyLeaveRequest, useLeaveTypes, useMyLeaveRequests } from './queries';
import { LeaveRequestStatusBadge } from './leave-request-status-badge';
import { getApiErrorMessage } from '@/lib/api-error';
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

export function MyLeaveRequestsList({ tenantId }: { tenantId: string }) {
  const { data: requests, isLoading, isError, error } = useMyLeaveRequests(tenantId);
  const { data: leaveTypes } = useLeaveTypes(tenantId);
  const cancelRequest = useCancelMyLeaveRequest(tenantId);

  const leaveTypeName = (id: string) => leaveTypes?.find((type) => type.id === id)?.name ?? id;

  async function handleCancel(id: string) {
    try {
      await cancelRequest.mutateAsync(id);
      toast.success('Leave request cancelled');
    } catch (cancelError) {
      toast.error(getApiErrorMessage(cancelError, 'Failed to cancel leave request'));
    }
  }

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
        {getApiErrorMessage(error, 'Failed to load leave requests')}
      </p>
    );
  }

  if (!requests || requests.length === 0) {
    return <p className="text-sm text-muted-foreground">No leave requests yet.</p>;
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Type</TableHead>
          <TableHead>Dates</TableHead>
          <TableHead>Days</TableHead>
          <TableHead>Status</TableHead>
          <TableHead />
        </TableRow>
      </TableHeader>
      <TableBody>
        {requests.map((request) => (
          <TableRow key={request.id}>
            <TableCell>{leaveTypeName(request.leaveTypeId)}</TableCell>
            <TableCell>
              {request.startDate.slice(0, 10)} – {request.endDate.slice(0, 10)}
            </TableCell>
            <TableCell>{request.daysRequested}</TableCell>
            <TableCell>
              <LeaveRequestStatusBadge status={request.status} />
            </TableCell>
            <TableCell>
              {(request.status === 'PENDING' || request.status === 'APPROVED') && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleCancel(request.id)}
                  disabled={cancelRequest.isPending}
                >
                  Cancel
                </Button>
              )}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
