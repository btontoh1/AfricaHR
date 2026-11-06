'use client';

import Link from 'next/link';
import { FileStack } from 'lucide-react';
import { useMyApplications } from './queries';
import { ApplicationStageBadge } from './application-stage-badge';
import { getApiErrorMessage, isNoEmployeeLinkedError } from '@/lib/api-error';
import { TableCard } from '@/components/table-card';
import { EmptyState } from '@/components/empty-state';
import { EmployeeLinkRequiredState } from '@/components/employee-link-required-state';
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

export function MyApplicationsList({ tenantId }: { tenantId: string }) {
  const { data: applications, isLoading, isError, error } = useMyApplications(tenantId);

  if (isLoading) {
    return <TableSkeleton />;
  }

  if (isError) {
    if (isNoEmployeeLinkedError(error)) {
      return <EmployeeLinkRequiredState />;
    }
    return <ErrorState message={getApiErrorMessage(error, 'Failed to load applications')} />;
  }

  if (!applications || applications.length === 0) {
    return <EmptyState icon={FileStack} title="No applications for requisitions you hire for yet" />;
  }

  return (
    <TableCard>
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
              <TableCell className="font-medium">
                {application.candidate.firstName} {application.candidate.lastName}
              </TableCell>
              <TableCell className="text-muted-foreground">{application.requisition.title}</TableCell>
              <TableCell>
                <ApplicationStageBadge stage={application.stage} />
              </TableCell>
              <TableCell>
                <Link
                  href={`/recruitment/applications/mine/${application.id}`}
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
