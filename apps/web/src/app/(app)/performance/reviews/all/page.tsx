'use client';

import { useSession } from '../../../session-provider';
import { StartReviewForEmployeeForm } from '@/features/performance/start-review-for-employee-form';
import { AllReviewsAdminList } from '@/features/performance/all-reviews-admin-list';

export default function AllReviewsAdminPage() {
  const session = useSession();
  const tenantId = session.tenantId as string;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">All reviews</h1>
      <StartReviewForEmployeeForm tenantId={tenantId} />
      <AllReviewsAdminList tenantId={tenantId} />
    </div>
  );
}
