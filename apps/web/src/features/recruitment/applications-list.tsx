'use client';

import { useState } from 'react';
import Link from 'next/link';
import { FileStack } from 'lucide-react';
import { useApplications } from './queries';
import { ApplicationStageBadge } from './application-stage-badge';
import { APPLICATION_STAGE_OPTIONS } from './recruitment-form-schema';
import type { ApplicationStage } from './types';
import { getApiErrorMessage } from '@/lib/api-error';
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

const ALL = 'ALL';

export function ApplicationsList({ tenantId }: { tenantId: string }) {
  const [stage, setStage] = useState<ApplicationStage | typeof ALL>(ALL);
  const { data: applications, isLoading, isError, error } = useApplications(tenantId, {
    stage: stage === ALL ? undefined : stage,
  });

  return (
    <div className="space-y-4">
      <Select value={stage} onValueChange={(value) => setStage(value as typeof stage)}>
        <SelectTrigger className="w-40">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={ALL}>ALL</SelectItem>
          {APPLICATION_STAGE_OPTIONS.map((option) => (
            <SelectItem key={option} value={option}>
              {option}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {isLoading && <TableSkeleton />}

      {isError && <ErrorState message={getApiErrorMessage(error, 'Failed to load applications')} />}

      {applications && applications.length === 0 && (
        <EmptyState icon={FileStack} title="No applications match this filter" />
      )}

      {applications && applications.length > 0 && (
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
                    <Link href={`/recruitment/applications/${application.id}`} className="text-sm text-primary hover:underline">
                      View
                    </Link>
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
