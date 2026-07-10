'use client';

import { useSession } from '../../session-provider';
import { CreateGoalForm } from '@/features/performance/create-goal-form';
import { MyGoalsList } from '@/features/performance/my-goals-list';

export default function PerformanceGoalsPage() {
  const session = useSession();
  const tenantId = session.tenantId as string;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">My goals</h1>
      <CreateGoalForm tenantId={tenantId} />
      <MyGoalsList tenantId={tenantId} />
    </div>
  );
}
