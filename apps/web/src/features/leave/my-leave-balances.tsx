'use client';

import { CalendarDays } from 'lucide-react';
import { useMyLeaveBalances } from './queries';
import { EmptyState } from '@/components/empty-state';
import { EmployeeLinkRequiredState } from '@/components/employee-link-required-state';
import { TableSkeleton } from '@/components/loading-state';
import { ErrorState } from '@/components/error-state';
import { getApiErrorMessage, isNoEmployeeLinkedError } from '@/lib/api-error';
import { TableCard } from '@/components/table-card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

export function MyLeaveBalances({ tenantId }: { tenantId: string }) {
  const { data: balances, isLoading, isError, error } = useMyLeaveBalances(tenantId);

  if (isLoading) {
    return <TableSkeleton />;
  }

  if (isError) {
    if (isNoEmployeeLinkedError(error)) {
      return <EmployeeLinkRequiredState />;
    }
    return <ErrorState message={getApiErrorMessage(error, 'Failed to load leave balances')} />;
  }

  if (!balances || balances.length === 0) {
    return (
      <EmptyState
        icon={CalendarDays}
        title="No leave types configured"
        description="Your organization hasn't set up any leave types yet."
      />
    );
  }

  return (
    <TableCard>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Leave type</TableHead>
            <TableHead>Entitled</TableHead>
            <TableHead>Used</TableHead>
            <TableHead>Remaining</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {balances.map((balance) => (
            <TableRow key={balance.leaveTypeId}>
              <TableCell className="font-medium">{balance.leaveTypeName}</TableCell>
              <TableCell>{balance.entitledDays}</TableCell>
              <TableCell>{balance.usedDays}</TableCell>
              <TableCell>{balance.remainingDays}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableCard>
  );
}
