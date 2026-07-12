'use client';

import { useSession } from '../../session-provider';
import { CreateBenefitPlanForm } from '@/features/benefits/create-benefit-plan-form';
import { BenefitPlansList } from '@/features/benefits/benefit-plans-list';
import { PageHeader } from '@/components/page-header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function BenefitPlansPage() {
  const session = useSession();
  const tenantId = session.tenantId as string;

  return (
    <div>
      <PageHeader title="Benefit plans" description="Configure the benefit plans available to your organization." />
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Add plan</CardTitle>
          </CardHeader>
          <CardContent>
            <CreateBenefitPlanForm tenantId={tenantId} />
          </CardContent>
        </Card>
        <BenefitPlansList tenantId={tenantId} />
      </div>
    </div>
  );
}
