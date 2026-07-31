'use client';

import { Users } from 'lucide-react';
import { toast } from 'sonner';
import { useApproveTeamLeaveRequest, useLeaveTypes, useTeamLeaveRequests } from './queries';
import { LeaveRequestStatusBadge } from './leave-request-status-badge';
import { RejectTeamLeaveRequestDialog } from './reject-team-leave-request-dialog';
import { getApiErrorMessage } from '@/lib/api-error';
import { Button } from '@/components/ui/button';
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

export function TeamLeaveRequestsList({ tenantId }: { tenantId: string }) {
  const { data: requests, isLoading, isError, error } = useTeamLeaveRequests(tenantId);
  const { data: leaveTypes } = useLeaveTypes(tenantId);
  const approveRequest = useApproveTeamLeaveRequest(tenantId);

  const leaveTypeName = (id: string) => leaveTypes?.find((type) => type.id === id)?.name ?? id;

  async function handleApprove(id: string) {
    try {
      await approveRequest.mutateAsync(id);
      toast.success('Leave request approved');
    } catch (approveError) {
      toast.error(getApiErrorMessage(approveError, 'Failed to approve leave request'));
    }
  }

  if (isLoading) {
    return <TableSkeleton />;
  }

  if (isError) {
    return <ErrorState message={getApiErrorMessage(error, "Failed to load your direct reports' leave requests")} />;
  }

  if (!requests || requests.length === 0) {
    return (
      <EmptyState
        icon={Users}
        title="No leave requests from your direct reports"
        description="This is empty unless you have employees reporting to you."
      />
    );
  }

  return (
    <TableCard>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Employee</TableHead>
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
              <TableCell>{request.employeeName}</TableCell>
              <TableCell>{leaveTypeName(request.leaveTypeId)}</TableCell>
              <TableCell className="text-muted-foreground">
                {request.startDate.slice(0, 10)} – {request.endDate.slice(0, 10)}
              </TableCell>
              <TableCell>{request.daysRequested}</TableCell>
              <TableCell>
                <LeaveRequestStatusBadge status={request.status} />
              </TableCell>
              <TableCell>
                {request.status === 'PENDING' && (
                  <div className="flex gap-2">
                    <Button size="sm" onClick={() => handleApprove(request.id)} disabled={approveRequest.isPending}>
                      Approve
                    </Button>
                    <RejectTeamLeaveRequestDialog tenantId={tenantId} id={request.id} />
                  </div>
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableCard>
  );
}
