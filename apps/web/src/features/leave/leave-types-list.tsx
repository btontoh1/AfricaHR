'use client';

import { ListChecks } from 'lucide-react';
import { toast } from 'sonner';
import { useLeaveTypes, useUpdateLeaveType } from './queries';
import { getApiErrorMessage } from '@/lib/api-error';
import { Badge } from '@/components/ui/badge';
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
    return <TableSkeleton />;
  }

  if (isError) {
    return <ErrorState message={getApiErrorMessage(error, 'Failed to load leave types')} />;
  }

  if (!leaveTypes || leaveTypes.length === 0) {
    return <EmptyState icon={ListChecks} title="No leave types yet" description="Add the first leave type below." />;
  }

  return (
    <TableCard>
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
              <TableCell className="font-medium">{leaveType.name}</TableCell>
              <TableCell className="text-muted-foreground">{leaveType.code}</TableCell>
              <TableCell>{leaveType.defaultEntitlementDays}</TableCell>
              <TableCell>{leaveType.isPaid ? 'Yes' : 'No'}</TableCell>
              <TableCell>
                <Badge variant={leaveType.isActive ? 'success' : 'secondary'}>
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
    </TableCard>
  );
}
