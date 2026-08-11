'use client';

import { CalendarClock } from 'lucide-react';
import { toast } from 'sonner';
import { useCancelMyLeaveRequest, useLeaveTypes, useMyLeaveRequests } from './queries';
import { LeaveRequestStatusBadge } from './leave-request-status-badge';
import { LeaveRequestReasonCell } from './leave-request-reason-cell';
import { getApiErrorMessage, isNoEmployeeLinkedError } from '@/lib/api-error';
import { Button } from '@/components/ui/button';
import { TableCard } from '@/components/table-card';
import { EmptyState } from '@/components/empty-state';
import { EmployeeLinkRequiredState } from '@/components/employee-link-required-state';
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
    return <TableSkeleton />;
  }

  if (isError) {
    if (isNoEmployeeLinkedError(error)) {
      return <EmployeeLinkRequiredState />;
    }
    return <ErrorState message={getApiErrorMessage(error, 'Failed to load leave requests')} />;
  }

  if (!requests || requests.length === 0) {
    return <EmptyState icon={CalendarClock} title="No leave requests yet" description="Requests you submit will appear here." />;
  }

  return (
    <TableCard>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Type</TableHead>
            <TableHead>Dates</TableHead>
            <TableHead>Days</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Reason</TableHead>
            <TableHead />
          </TableRow>
        </TableHeader>
        <TableBody>
          {requests.map((request) => (
            <TableRow key={request.id}>
              <TableCell>{leaveTypeName(request.leaveTypeId)}</TableCell>
              <TableCell className="text-muted-foreground">
                {request.startDate.slice(0, 10)} – {request.endDate.slice(0, 10)}
              </TableCell>
              <TableCell>{request.daysRequested}</TableCell>
              <TableCell>
                <LeaveRequestStatusBadge status={request.status} />
              </TableCell>
              <TableCell>
                <LeaveRequestReasonCell
                  reason={request.reason}
                  rejectionReason={request.rejectionReason}
                  status={request.status}
                />
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
    </TableCard>
  );
}
