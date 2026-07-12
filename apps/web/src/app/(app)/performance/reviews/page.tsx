'use client';

import { useSession } from '../../session-provider';
import { StartReviewForm } from '@/features/performance/start-review-form';
import { MyReviewsList } from '@/features/performance/my-reviews-list';
import { PageHeader } from '@/components/page-header';

export default function PerformanceReviewsPage() {
  const session = useSession();
  const tenantId = session.tenantId as string;

  return (
    <div>
      <PageHeader title="My reviews" description="Complete self-assessments for your active review cycles." />
      <div className="space-y-6">
        <StartReviewForm tenantId={tenantId} />
        <MyReviewsList tenantId={tenantId} />
      </div>
    </div>
  );
}
