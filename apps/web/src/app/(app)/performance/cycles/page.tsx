'use client';

import { useSession } from '../../session-provider';
import { CreateReviewCycleForm } from '@/features/performance/create-review-cycle-form';
import { ReviewCyclesList } from '@/features/performance/review-cycles-list';
import { PageHeader } from '@/components/page-header';

export default function ReviewCyclesPage() {
  const session = useSession();
  const tenantId = session.tenantId as string;

  return (
    <div>
      <PageHeader title="Review cycles" description="Configure the performance review cycles for your organization." />
      <div className="space-y-6">
        <CreateReviewCycleForm tenantId={tenantId} />
        <ReviewCyclesList tenantId={tenantId} />
      </div>
    </div>
  );
}
