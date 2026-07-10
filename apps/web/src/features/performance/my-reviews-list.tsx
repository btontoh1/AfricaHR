'use client';

import Link from 'next/link';
import { useMyReviews, useReviewCycles } from './queries';
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

export function MyReviewsList({ tenantId }: { tenantId: string }) {
  const { data: reviews, isLoading, isError, error } = useMyReviews(tenantId);
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
        {getApiErrorMessage(error, 'Failed to load your reviews')}
      </p>
    );
  }

  if (!reviews || reviews.length === 0) {
    return <p className="text-sm text-muted-foreground">No reviews yet.</p>;
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Cycle</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Self rating</TableHead>
          <TableHead>Manager rating</TableHead>
          <TableHead />
        </TableRow>
      </TableHeader>
      <TableBody>
        {reviews.map((review) => (
          <TableRow key={review.id}>
            <TableCell>{cycleName(review.cycleId)}</TableCell>
            <TableCell>
              <ReviewStatusBadge status={review.status} />
            </TableCell>
            <TableCell>{review.selfRating ?? '—'}</TableCell>
            <TableCell>{review.managerRating ?? '—'}</TableCell>
            <TableCell>
              <Link href={`/performance/reviews/${review.id}`} className="text-sm underline">
                View
              </Link>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
