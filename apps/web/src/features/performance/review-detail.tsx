'use client';

import { useAllReview, useMyReview, useReviewCycles, useTeamReview } from './queries';
import { ReviewStatusBadge } from './review-status-badge';
import { SelfAssessmentForm } from './self-assessment-form';
import { ManagerAssessmentForm } from './manager-assessment-form';
import { getApiErrorMessage } from '@/lib/api-error';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CardSkeleton } from '@/components/loading-state';
import { ErrorState } from '@/components/error-state';
import { PageHeader } from '@/components/page-header';

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
    return <CardSkeleton />;
  }

  if (isError || !review) {
    return <ErrorState message={getApiErrorMessage(error, 'Failed to load review')} />;
  }

  const canSubmitSelf = tier === 'self' && review.status === 'DRAFT';
  const canSubmitManager = tier === 'manager' && review.status !== 'COMPLETED';

  return (
    <div className="space-y-6">
      <PageHeader title={cycleName} action={<ReviewStatusBadge status={review.status} />} />

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
