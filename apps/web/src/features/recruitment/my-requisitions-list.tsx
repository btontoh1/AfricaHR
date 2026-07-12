'use client';

import Link from 'next/link';
import { Briefcase } from 'lucide-react';
import { useMyRequisitions } from './queries';
import { RequisitionStatusBadge } from './requisition-status-badge';
import { getApiErrorMessage } from '@/lib/api-error';
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

export function MyRequisitionsList({ tenantId }: { tenantId: string }) {
  const { data: requisitions, isLoading, isError, error } = useMyRequisitions(tenantId);

  if (isLoading) {
    return <TableSkeleton />;
  }

  if (isError) {
    return <ErrorState message={getApiErrorMessage(error, 'Failed to load your job requisitions')} />;
  }

  if (!requisitions || requisitions.length === 0) {
    return (
      <EmptyState icon={Briefcase} title="No job requisitions assigned to you as hiring manager yet" />
    );
  }

  return (
    <TableCard>
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
              <TableCell className="font-medium">{requisition.title}</TableCell>
              <TableCell className="text-muted-foreground">
                {requisition.employmentType.replace('_', ' ')}
              </TableCell>
              <TableCell>{requisition.openings}</TableCell>
              <TableCell>
                <RequisitionStatusBadge status={requisition.status} />
              </TableCell>
              <TableCell>
                <Link
                  href={`/recruitment/requisitions/mine/${requisition.id}`}
                  className="text-sm text-primary hover:underline"
                >
                  View
                </Link>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableCard>
  );
}
