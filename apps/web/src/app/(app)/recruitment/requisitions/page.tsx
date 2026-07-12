'use client';

import { useSession } from '../../session-provider';
import { RequisitionsList } from '@/features/recruitment/requisitions-list';
import { PageHeader } from '@/components/page-header';

export default function RequisitionsPage() {
  const session = useSession();
  const tenantId = session.tenantId as string;

  return (
    <div>
      <PageHeader title="Job requisitions" description="Review and approve open headcount requests." />
      <RequisitionsList tenantId={tenantId} />
    </div>
  );
}
