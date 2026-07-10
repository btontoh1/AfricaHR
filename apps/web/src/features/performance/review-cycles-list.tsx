'use client';

import { toast } from 'sonner';
import { useReviewCycles, useUpdateReviewCycle } from './queries';
import { ReviewCycleStatusBadge } from './review-cycle-status-badge';
import { getApiErrorMessage } from '@/lib/api-error';
import type { ReviewCycleStatus } from './types';
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

const STATUS_OPTIONS: ReviewCycleStatus[] = ['UPCOMING', 'ACTIVE', 'CLOSED'];

function StatusControl({ tenantId, id, status }: { tenantId: string; id: string; status: ReviewCycleStatus }) {
  const updateCycle = useUpdateReviewCycle(tenantId, id);

  async function handleChange(next: string) {
    try {
      await updateCycle.mutateAsync({ status: next as ReviewCycleStatus });
      toast.success('Review cycle updated');
    } catch (error) {
      toast.error(getApiErrorMessage(error, 'Failed to update review cycle'));
    }
  }

  return (
    <Select value={status} onValueChange={handleChange} disabled={updateCycle.isPending}>
      <SelectTrigger className="w-32">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {STATUS_OPTIONS.map((option) => (
          <SelectItem key={option} value={option}>
            {option}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

export function ReviewCyclesList({ tenantId }: { tenantId: string }) {
  const { data: cycles, isLoading, isError, error } = useReviewCycles(tenantId);

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
        {getApiErrorMessage(error, 'Failed to load review cycles')}
      </p>
    );
  }

  if (!cycles || cycles.length === 0) {
    return <p className="text-sm text-muted-foreground">No review cycles yet.</p>;
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Name</TableHead>
          <TableHead>Start date</TableHead>
          <TableHead>End date</TableHead>
          <TableHead>Status</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {cycles.map((cycle) => (
          <TableRow key={cycle.id}>
            <TableCell>{cycle.name}</TableCell>
            <TableCell>{cycle.startDate.slice(0, 10)}</TableCell>
            <TableCell>{cycle.endDate.slice(0, 10)}</TableCell>
            <TableCell>
              <div className="flex items-center gap-2">
                <ReviewCycleStatusBadge status={cycle.status} />
                <StatusControl tenantId={tenantId} id={cycle.id} status={cycle.status} />
              </div>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
