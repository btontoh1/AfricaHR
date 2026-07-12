'use client';

import { useSession } from '../session-provider';
import { EnrollForm } from '@/features/benefits/enroll-form';
import { MyBenefitEnrollmentsList } from '@/features/benefits/my-benefit-enrollments-list';
import { PageHeader } from '@/components/page-header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function BenefitsPage() {
  const session = useSession();
  const tenantId = session.tenantId as string;

  return (
    <div>
      <PageHeader title="My benefits" description="View and manage your benefit plan enrollments." />
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Enroll in a plan</CardTitle>
          </CardHeader>
          <CardContent>
            <EnrollForm tenantId={tenantId} />
          </CardContent>
        </Card>
        <MyBenefitEnrollmentsList tenantId={tenantId} />
      </div>
    </div>
  );
}
