'use client';

import { useSession } from '../../../session-provider';
import { StartReviewForEmployeeForm } from '@/features/performance/start-review-for-employee-form';
import { AllReviewsAdminList } from '@/features/performance/all-reviews-admin-list';
import { PageHeader } from '@/components/page-header';

export default function AllReviewsAdminPage() {
  const session = useSession();
  const tenantId = session.tenantId as string;

  return (
    <div>
      <PageHeader title="All reviews" description="Start and oversee performance reviews across the organization." />
      <div className="space-y-6">
        <StartReviewForEmployeeForm tenantId={tenantId} />
        <AllReviewsAdminList tenantId={tenantId} />
      </div>
    </div>
  );
}
