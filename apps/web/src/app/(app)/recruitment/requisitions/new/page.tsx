'use client';

import { useSession } from '../../../session-provider';
import { CreateRequisitionForm } from '@/features/recruitment/create-requisition-form';
import { PageHeader } from '@/components/page-header';

export default function NewRequisitionPage() {
  const session = useSession();
  const tenantId = session.tenantId as string;

  return (
    <div className="mx-auto max-w-2xl">
      <PageHeader title="New requisition" description="Request approval to open a new role." />
      <CreateRequisitionForm tenantId={tenantId} />
    </div>
  );
}
