'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useApplications } from './queries';
import { ApplicationStageBadge } from './application-stage-badge';
import { APPLICATION_STAGE_OPTIONS } from './recruitment-form-schema';
import type { ApplicationStage } from './types';
import { getApiErrorMessage } from '@/lib/api-error';
import { Skeleton } from '@/components/ui/skeleton';
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

      {isLoading && (
        <div className="space-y-2">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
        </div>
      )}

      {isError && (
        <p className="text-sm text-destructive">
          {getApiErrorMessage(error, 'Failed to load applications')}
        </p>
      )}

      {applications && applications.length === 0 && (
        <p className="text-sm text-muted-foreground">No applications match this filter.</p>
      )}

      {applications && applications.length > 0 && (
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
                  <Link href={`/recruitment/applications/${application.id}`} className="text-sm underline">
                    View
                  </Link>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  );
}
