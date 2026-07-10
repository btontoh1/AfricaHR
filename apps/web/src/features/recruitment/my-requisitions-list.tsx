'use client';

import Link from 'next/link';
import { useMyRequisitions } from './queries';
import { RequisitionStatusBadge } from './requisition-status-badge';
import { getApiErrorMessage } from '@/lib/api-error';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

export function MyRequisitionsList({ tenantId }: { tenantId: string }) {
  const { data: requisitions, isLoading, isError, error } = useMyRequisitions(tenantId);

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
        {getApiErrorMessage(error, 'Failed to load your job requisitions')}
      </p>
    );
  }

  if (!requisitions || requisitions.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        No job requisitions assigned to you as hiring manager yet.
      </p>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Title</TableHead>
          <TableHead>Employment type</TableHead>
          <TableHead>Openings</TableHead>
          <TableHead>Status</TableHead>
          <TableHead />
        </TableRow>
      </TableHeader>
      <TableBody>
        {requisitions.map((requisition) => (
          <TableRow key={requisition.id}>
            <TableCell>{requisition.title}</TableCell>
            <TableCell>{requisition.employmentType.replace('_', ' ')}</TableCell>
            <TableCell>{requisition.openings}</TableCell>
            <TableCell>
              <RequisitionStatusBadge status={requisition.status} />
            </TableCell>
            <TableCell>
              <Link
                href={`/recruitment/requisitions/mine/${requisition.id}`}
                className="text-sm underline"
              >
                View
              </Link>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
