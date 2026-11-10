'use client';

import { useState } from 'react';
import { History } from 'lucide-react';
import { useAssetAssignmentHistory } from './queries';
import { useEmployees } from '@/features/employees/queries';
import { getApiErrorMessage } from '@/lib/api-error';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { TableSkeleton } from '@/components/loading-state';
import { ErrorState } from '@/components/error-state';
import { EmptyState } from '@/components/empty-state';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

export function AssetAssignmentHistoryDialog({ tenantId, assetId, label }: { tenantId: string; assetId: string; label: string }) {
  const [open, setOpen] = useState(false);
  const { data: history, isLoading, isError, error } = useAssetAssignmentHistory(tenantId, open ? assetId : '');
  const { data: employees } = useEmployees(tenantId);

  const employeeName = (id: string) => {
    const employee = employees?.find((e) => e.id === id);
    return employee ? `${employee.firstName} ${employee.lastName}` : id;
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <History className="size-4" />
          History
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Assignment history — {label}</DialogTitle>
        </DialogHeader>
        {isLoading && <TableSkeleton rows={3} />}
        {isError && <ErrorState message={getApiErrorMessage(error, 'Failed to load assignment history')} />}
        {history && history.length === 0 && <EmptyState icon={History} title="Never assigned" />}
        {history && history.length > 0 && (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Employee</TableHead>
                <TableHead>Assigned</TableHead>
                <TableHead>Returned</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {history.map((entry) => (
                <TableRow key={entry.id}>
                  <TableCell>{employeeName(entry.employeeId)}</TableCell>
                  <TableCell className="text-muted-foreground">{String(entry.assignedAt).slice(0, 10)}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {entry.returnedAt ? String(entry.returnedAt).slice(0, 10) : '—'}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </DialogContent>
    </Dialog>
  );
}
