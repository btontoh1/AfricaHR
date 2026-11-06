'use client';

import { useState } from 'react';
import { ClipboardCheck } from 'lucide-react';
import { toast } from 'sonner';
import { useApproveLeaveRequest, useLeaveRequests, useLeaveTypes } from './queries';
import { useEmployees } from '@/features/employees/queries';
import { LeaveRequestStatusBadge } from './leave-request-status-badge';
import { LeaveRequestReasonCell } from './leave-request-reason-cell';
import { RejectLeaveRequestDialog } from './reject-leave-request-dialog';
import { EditLeaveRequestDialog } from './edit-leave-request-dialog';
import { getApiErrorMessage } from '@/lib/api-error';
import type { LeaveRequestStatus } from './types';
import { Button } from '@/components/ui/button';
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

const STATUS_FILTERS: (LeaveRequestStatus | 'ALL')[] = ['ALL', 'PENDING', 'APPROVED', 'REJECTED', 'CANCELLED'];

export function LeaveApprovalQueue({ tenantId }: { tenantId: string }) {
  const [statusFilter, setStatusFilter] = useState<LeaveRequestStatus | 'ALL'>('PENDING');
  const { data: requests, isLoading, isError, error } = useLeaveRequests(
    tenantId,
    statusFilter === 'ALL' ? undefined : statusFilter,
  );
  const { data: leaveTypes } = useLeaveTypes(tenantId);
  const { data: employees } = useEmployees(tenantId);
  const approveRequest = useApproveLeaveRequest(tenantId);

  const leaveTypeName = (id: string) => leaveTypes?.find((type) => type.id === id)?.name ?? id;
  const employeeName = (id: string) => {
    const employee = employees?.find((e) => e.id === id);
    return employee ? `${employee.firstName} ${employee.lastName}` : id;
  };

  async function handleApprove(id: string) {
    try {
      await approveRequest.mutateAsync(id);
      toast.success('Leave request approved');
    } catch (approveError) {
      toast.error(getApiErrorMessage(approveError, 'Failed to approve leave request'));
    }
  }

  return (
    <div className="space-y-4">
      <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value as typeof statusFilter)}>
        <SelectTrigger className="w-48">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {STATUS_FILTERS.map((status) => (
            <SelectItem key={status} value={status}>
              {status}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {isLoading && <TableSkeleton />}

      {isError && <ErrorState message={getApiErrorMessage(error, 'Failed to load leave requests')} />}

      {requests && requests.length === 0 && (
        <EmptyState icon={ClipboardCheck} title="No leave requests match this filter" />
      )}

      {requests && requests.length > 0 && (
        <TableCard>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Employee</TableHead>
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
                  <TableCell>{employeeName(request.employeeId)}</TableCell>
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
                    <div className="flex gap-2">
                      {request.status === 'PENDING' && (
                        <>
                          <Button size="sm" onClick={() => handleApprove(request.id)} disabled={approveRequest.isPending}>
                            Approve
                          </Button>
                          <RejectLeaveRequestDialog tenantId={tenantId} id={request.id} />
                        </>
                      )}
                      {(request.status === 'PENDING' || request.status === 'APPROVED') && (
                        <EditLeaveRequestDialog tenantId={tenantId} request={request} />
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableCard>
      )}
    </div>
  );
}
