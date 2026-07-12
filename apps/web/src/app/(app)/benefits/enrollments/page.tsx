'use client';

import { useSession } from '../../session-provider';
import { EnrollEmployeeForm } from '@/features/benefits/enroll-employee-form';
import { BenefitEnrollmentsAdminList } from '@/features/benefits/benefit-enrollments-admin-list';
import { PageHeader } from '@/components/page-header';

export default function BenefitEnrollmentsPage() {
  const session = useSession();
  const tenantId = session.tenantId as string;

  return (
    <div className="space-y-6">
      <PageHeader title="Benefit enrollments" description="Enroll employees and manage active enrollments." />
      <EnrollEmployeeForm tenantId={tenantId} />
      <BenefitEnrollmentsAdminList tenantId={tenantId} />
    </div>
  );
}
