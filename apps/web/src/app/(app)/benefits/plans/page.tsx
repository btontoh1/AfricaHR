'use client';

import { useSession } from '../../session-provider';
import { CreateBenefitPlanForm } from '@/features/benefits/create-benefit-plan-form';
import { BenefitPlansList } from '@/features/benefits/benefit-plans-list';

export default function BenefitPlansPage() {
  const session = useSession();
  const tenantId = session.tenantId as string;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Benefit plans</h1>
      <CreateBenefitPlanForm tenantId={tenantId} />
      <BenefitPlansList tenantId={tenantId} />
    </div>
  );
}
