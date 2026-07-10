'use client';

import { useSession } from '../session-provider';
import { EnrollForm } from '@/features/benefits/enroll-form';
import { MyBenefitEnrollmentsList } from '@/features/benefits/my-benefit-enrollments-list';

export default function BenefitsPage() {
  const session = useSession();
  const tenantId = session.tenantId as string;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">My benefits</h1>
      <EnrollForm tenantId={tenantId} />
      <MyBenefitEnrollmentsList tenantId={tenantId} />
    </div>
  );
}
