'use client';

import { useSession } from '../../session-provider';
import { CreateReviewCycleForm } from '@/features/performance/create-review-cycle-form';
import { ReviewCyclesList } from '@/features/performance/review-cycles-list';

export default function ReviewCyclesPage() {
  const session = useSession();
  const tenantId = session.tenantId as string;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Review cycles</h1>
      <CreateReviewCycleForm tenantId={tenantId} />
      <ReviewCyclesList tenantId={tenantId} />
    </div>
  );
}
