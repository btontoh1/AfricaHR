'use client';

import { useSession } from '../../../session-provider';
import { CreateRequisitionForm } from '@/features/recruitment/create-requisition-form';

export default function NewRequisitionPage() {
  const session = useSession();
  const tenantId = session.tenantId as string;

  return (
    <div className="mx-auto max-w-2xl">
      <CreateRequisitionForm tenantId={tenantId} />
    </div>
  );
}
