'use client';

import { useSession } from '../../session-provider';
import { CreateGoalForm } from '@/features/performance/create-goal-form';
import { MyGoalsList } from '@/features/performance/my-goals-list';
import { PageHeader } from '@/components/page-header';

export default function PerformanceGoalsPage() {
  const session = useSession();
  const tenantId = session.tenantId as string;

  return (
    <div>
      <PageHeader title="My goals" description="Track progress against your performance goals." />
      <div className="space-y-6">
        <CreateGoalForm tenantId={tenantId} />
        <MyGoalsList tenantId={tenantId} />
      </div>
    </div>
  );
}
