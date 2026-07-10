'use client';

import Link from 'next/link';
import { useCandidates } from './queries';
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

export function CandidatesList({ tenantId }: { tenantId: string }) {
  const { data: candidates, isLoading, isError, error } = useCandidates(tenantId);

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
        {getApiErrorMessage(error, 'Failed to load candidates')}
      </p>
    );
  }

  if (!candidates || candidates.length === 0) {
    return <p className="text-sm text-muted-foreground">No candidates yet.</p>;
  }

  return (
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
            <TableCell>
              {candidate.firstName} {candidate.lastName}
            </TableCell>
            <TableCell>{candidate.email}</TableCell>
            <TableCell>{candidate.source ?? '—'}</TableCell>
            <TableCell>
              <Link href={`/recruitment/candidates/${candidate.id}`} className="text-sm underline">
                View
              </Link>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
