'use client';

import { useAllReview, useMyReview, useReviewCycles, useTeamReview } from './queries';
import { ReviewStatusBadge } from './review-status-badge';
import { SelfAssessmentForm } from './self-assessment-form';
import { ManagerAssessmentForm } from './manager-assessment-form';
import { getApiErrorMessage } from '@/lib/api-error';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

function Field({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="text-sm">{value ?? '—'}</div>
    </div>
  );
}

export function ReviewDetail({
  tenantId,
  reviewId,
  tier,
}: {
  tenantId: string;
  reviewId: string;
  tier: 'self' | 'manager' | 'hr';
}) {
  const selfQuery = useMyReview(tenantId, tier === 'self' ? reviewId : '');
  const managerQuery = useTeamReview(tenantId, tier === 'manager' ? reviewId : '');
  const hrQuery = useAllReview(tenantId, tier === 'hr' ? reviewId : '');
  const { data: review, isLoading, isError, error } =
    tier === 'self' ? selfQuery : tier === 'manager' ? managerQuery : hrQuery;
  const { data: cycles } = useReviewCycles(tenantId);

  const cycleName = review
    ? (cycles?.find((cycle) => cycle.id === review.cycleId)?.name ?? review.cycleId)
    : '';

  if (isLoading) {
    return (
      <div className="space-y-2">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-32 w-full" />
      </div>
    );
  }

  if (isError || !review) {
    return (
      <p className="text-sm text-destructive">
        {getApiErrorMessage(error, 'Failed to load review')}
      </p>
    );
  }

  const canSubmitSelf = tier === 'self' && review.status === 'DRAFT';
  const canSubmitManager = tier === 'manager' && review.status !== 'COMPLETED';

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">{cycleName}</h1>
        <ReviewStatusBadge status={review.status} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Self-assessment</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <Field label="Rating" value={review.selfRating} />
          <Field label="Comments" value={review.selfComments} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Manager assessment</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <Field label="Rating" value={review.managerRating} />
          <Field label="Comments" value={review.managerComments} />
        </CardContent>
      </Card>

      {canSubmitSelf && <SelfAssessmentForm tenantId={tenantId} reviewId={reviewId} />}
      {canSubmitManager && <ManagerAssessmentForm tenantId={tenantId} reviewId={reviewId} />}
    </div>
  );
}
