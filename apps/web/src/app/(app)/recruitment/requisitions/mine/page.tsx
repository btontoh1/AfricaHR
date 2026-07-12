'use client';

import { useSession } from '../../../session-provider';
import { MyRequisitionsList } from '@/features/recruitment/my-requisitions-list';
import { PageHeader } from '@/components/page-header';

export default function MyRequisitionsPage() {
  const session = useSession();
  const tenantId = session.tenantId as string;

  return (
    <div>
      <PageHeader title="My requisitions" description="Track the requisitions you've submitted." />
      <MyRequisitionsList tenantId={tenantId} />
    </div>
  );
}
