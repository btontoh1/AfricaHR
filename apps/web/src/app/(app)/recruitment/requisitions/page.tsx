'use client';

import { useSession } from '../../session-provider';
import { RequisitionsList } from '@/features/recruitment/requisitions-list';

export default function RequisitionsPage() {
  const session = useSession();
  const tenantId = session.tenantId as string;

  return (
    <div>
      <h1 className="mb-6 text-2xl font-semibold">Job requisitions</h1>
      <RequisitionsList tenantId={tenantId} />
    </div>
  );
}
