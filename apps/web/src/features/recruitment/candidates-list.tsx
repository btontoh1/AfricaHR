'use client';

import Link from 'next/link';
import { UserSquare2 } from 'lucide-react';
import { useCandidates } from './queries';
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

export function CandidatesList({ tenantId }: { tenantId: string }) {
  const { data: candidates, isLoading, isError, error } = useCandidates(tenantId);

  if (isLoading) {
    return <TableSkeleton />;
  }

  if (isError) {
    return <ErrorState message={getApiErrorMessage(error, 'Failed to load candidates')} />;
  }

  if (!candidates || candidates.length === 0) {
    return <EmptyState icon={UserSquare2} title="No candidates yet" description="Add the first candidate above." />;
  }

  return (
    <TableCard>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>Source</TableHead>
            <TableHead />
          </TableRow>
        </TableHeader>
        <TableBody>
          {candidates.map((candidate) => (
            <TableRow key={candidate.id}>
              <TableCell className="font-medium">
                {candidate.firstName} {candidate.lastName}
              </TableCell>
              <TableCell className="text-muted-foreground">{candidate.email}</TableCell>
              <TableCell className="text-muted-foreground">{candidate.source ?? '—'}</TableCell>
              <TableCell>
                <Link href={`/recruitment/candidates/${candidate.id}`} className="text-sm text-primary hover:underline">
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
