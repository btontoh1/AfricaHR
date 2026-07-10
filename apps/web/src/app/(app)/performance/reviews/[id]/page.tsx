'use client';

import { use } from 'react';
import { useSession } from '../../../session-provider';
import { ReviewDetail } from '@/features/performance/review-detail';

export default function PerformanceReviewDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const session = useSession();
  const tenantId = session.tenantId as string;

  return <ReviewDetail tenantId={tenantId} reviewId={id} tier="self" />;
}
