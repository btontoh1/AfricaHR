'use client';

import { useSession } from '../../session-provider';
import { StartReviewForm } from '@/features/performance/start-review-form';
import { MyReviewsList } from '@/features/performance/my-reviews-list';

export default function PerformanceReviewsPage() {
  const session = useSession();
  const tenantId = session.tenantId as string;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">My reviews</h1>
      <StartReviewForm tenantId={tenantId} />
      <MyReviewsList tenantId={tenantId} />
    </div>
  );
}
