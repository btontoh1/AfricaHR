'use client';

import Link from 'next/link';
import { useReviewCycles, useTeamReviews } from './queries';
import { ReviewStatusBadge } from './review-status-badge';
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

export function TeamReviewsList({ tenantId }: { tenantId: string }) {
  const { data: reviews, isLoading, isError, error } = useTeamReviews(tenantId);
  const { data: cycles } = useReviewCycles(tenantId);

  const cycleName = (id: string) => cycles?.find((cycle) => cycle.id === id)?.name ?? id;

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
        {getApiErrorMessage(error, "Failed to load your direct reports' reviews")}
      </p>
    );
  }

  if (!reviews || reviews.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        No reviews for your direct reports yet — this is empty unless you have employees
        reporting to you.
      </p>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Employee</TableHead>
          <TableHead>Cycle</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Self rating</TableHead>
          <TableHead />
        </TableRow>
      </TableHeader>
      <TableBody>
        {reviews.map((review) => (
          <TableRow key={review.id}>
            <TableCell className="font-mono text-xs">{review.employeeId}</TableCell>
            <TableCell>{cycleName(review.cycleId)}</TableCell>
            <TableCell>
              <ReviewStatusBadge status={review.status} />
            </TableCell>
            <TableCell>{review.selfRating ?? '—'}</TableCell>
            <TableCell>
              <Link href={`/performance/reviews/team/${review.id}`} className="text-sm underline">
                View
              </Link>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
