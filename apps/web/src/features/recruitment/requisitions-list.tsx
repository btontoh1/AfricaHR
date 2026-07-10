'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRequisitions } from './queries';
import { RequisitionStatusBadge } from './requisition-status-badge';
import { REQUISITION_STATUS_OPTIONS } from './recruitment-form-schema';
import type { JobRequisitionStatus } from './types';
import { getApiErrorMessage } from '@/lib/api-error';
import { Button } from '@/components/ui/button';
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

export function RequisitionsList({ tenantId }: { tenantId: string }) {
  const [status, setStatus] = useState<JobRequisitionStatus | typeof ALL>(ALL);
  const { data: requisitions, isLoading, isError, error } = useRequisitions(tenantId, {
    status: status === ALL ? undefined : status,
  });

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <Select value={status} onValueChange={(value) => setStatus(value as typeof status)}>
          <SelectTrigger className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>ALL</SelectItem>
            {REQUISITION_STATUS_OPTIONS.map((option) => (
              <SelectItem key={option} value={option}>
                {option}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button asChild>
          <Link href="/recruitment/requisitions/new">New requisition</Link>
        </Button>
      </div>

      {isLoading && (
        <div className="space-y-2">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
        </div>
      )}

      {isError && (
        <p className="text-sm text-destructive">
          {getApiErrorMessage(error, 'Failed to load job requisitions')}
        </p>
      )}

      {requisitions && requisitions.length === 0 && (
        <p className="text-sm text-muted-foreground">No job requisitions match this filter.</p>
      )}

      {requisitions && requisitions.length > 0 && (
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
                    href={`/recruitment/requisitions/${requisition.id}`}
                    className="text-sm underline"
                  >
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
