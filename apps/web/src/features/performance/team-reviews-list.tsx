'use client';

import Link from 'next/link';
import { Users } from 'lucide-react';
import { useReviewCycles, useTeamReviews } from './queries';
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

export function TeamReviewsList({ tenantId }: { tenantId: string }) {
  const { data: reviews, isLoading, isError, error } = useTeamReviews(tenantId);
  const { data: cycles } = useReviewCycles(tenantId);

  const cycleName = (id: string) => cycles?.find((cycle) => cycle.id === id)?.name ?? id;

  if (isLoading) {
    return <TableSkeleton />;
  }

  if (isError) {
    return <ErrorState message={getApiErrorMessage(error, "Failed to load your direct reports' reviews")} />;
  }

  if (!reviews || reviews.length === 0) {
    return (
      <EmptyState
        icon={Users}
        title="No reviews for your direct reports yet"
        description="This is empty unless you have employees reporting to you."
      />
    );
  }

  return (
    <TableCard>
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
                <Link href={`/performance/reviews/team/${review.id}`} className="text-sm text-primary hover:underline">
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
