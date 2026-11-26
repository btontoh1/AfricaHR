'use client';

import { useSession } from '../../session-provider';
import { usePolicies } from '@/features/intranet/queries';
import { UploadPolicyDialog } from '@/features/intranet/upload-policy-dialog';
import { PoliciesTable } from '@/features/intranet/policies-table';
import { PageHeader } from '@/components/page-header';

export default function PoliciesPage() {
  const session = useSession();
  const tenantId = session.tenantId as string;
  const { data: policies } = usePolicies(tenantId);

  return (
    <div>
      <PageHeader
        title="Policies"
        description="Upload HR policy documents and see who has read them."
        action={<UploadPolicyDialog tenantId={tenantId} policies={policies ?? []} />}
      />
      <PoliciesTable tenantId={tenantId} />
    </div>
  );
}
