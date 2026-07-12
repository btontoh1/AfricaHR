'use client';

import Link from 'next/link';
import { ClipboardCheck } from 'lucide-react';
import { useMyReviews, useReviewCycles } from './queries';
import { ReviewStatusBadge } from './review-status-badge';
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

export function MyReviewsList({ tenantId }: { tenantId: string }) {
  const { data: reviews, isLoading, isError, error } = useMyReviews(tenantId);
  const { data: cycles } = useReviewCycles(tenantId);

  const cycleName = (id: string) => cycles?.find((cycle) => cycle.id === id)?.name ?? id;

  if (isLoading) {
    return <TableSkeleton />;
  }

  if (isError) {
    return <ErrorState message={getApiErrorMessage(error, 'Failed to load your reviews')} />;
  }

  if (!reviews || reviews.length === 0) {
    return <EmptyState icon={ClipboardCheck} title="No reviews yet" />;
  }

  return (
    <TableCard>
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
              <TableCell className="font-medium">{cycleName(review.cycleId)}</TableCell>
              <TableCell>
                <ReviewStatusBadge status={review.status} />
              </TableCell>
              <TableCell>{review.selfRating ?? '—'}</TableCell>
              <TableCell>{review.managerRating ?? '—'}</TableCell>
              <TableCell>
                <Link href={`/performance/reviews/${review.id}`} className="text-sm text-primary hover:underline">
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
