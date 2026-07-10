'use client';

import Link from 'next/link';
import { useMyApplications } from './queries';
import { ApplicationStageBadge } from './application-stage-badge';
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

export function MyApplicationsList({ tenantId }: { tenantId: string }) {
  const { data: applications, isLoading, isError, error } = useMyApplications(tenantId);

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
        {getApiErrorMessage(error, 'Failed to load applications')}
      </p>
    );
  }

  if (!applications || applications.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        No applications for requisitions you hire for yet.
      </p>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Candidate</TableHead>
          <TableHead>Requisition</TableHead>
          <TableHead>Stage</TableHead>
          <TableHead />
        </TableRow>
      </TableHeader>
      <TableBody>
        {applications.map((application) => (
          <TableRow key={application.id}>
            <TableCell>
              {application.candidate.firstName} {application.candidate.lastName}
            </TableCell>
            <TableCell>{application.requisition.title}</TableCell>
            <TableCell>
              <ApplicationStageBadge stage={application.stage} />
            </TableCell>
            <TableCell>
              <Link
                href={`/recruitment/applications/mine/${application.id}`}
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
