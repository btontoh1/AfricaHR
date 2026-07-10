'use client';

import { useSession } from '../../session-provider';
import { EnrollEmployeeForm } from '@/features/benefits/enroll-employee-form';
import { BenefitEnrollmentsAdminList } from '@/features/benefits/benefit-enrollments-admin-list';

export default function BenefitEnrollmentsPage() {
  const session = useSession();
  const tenantId = session.tenantId as string;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Benefit enrollments</h1>
      <EnrollEmployeeForm tenantId={tenantId} />
      <BenefitEnrollmentsAdminList tenantId={tenantId} />
    </div>
  );
}
