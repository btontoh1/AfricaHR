'use client';

import { useSession } from '../../../session-provider';
import { MyRequisitionsList } from '@/features/recruitment/my-requisitions-list';

export default function MyRequisitionsPage() {
  const session = useSession();
  const tenantId = session.tenantId as string;

  return (
    <div>
      <h1 className="mb-6 text-2xl font-semibold">My requisitions</h1>
      <MyRequisitionsList tenantId={tenantId} />
    </div>
  );
}
