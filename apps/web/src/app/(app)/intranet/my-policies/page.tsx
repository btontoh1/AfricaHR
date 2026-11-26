'use client';

import { useSession } from '../../session-provider';
import { MyPoliciesList } from '@/features/intranet/my-policies-list';
import { PageHeader } from '@/components/page-header';

export default function MyPoliciesPage() {
  const session = useSession();
  const tenantId = session.tenantId as string;

  return (
    <div>
      <PageHeader title="My Policies" description="Policies and documents that apply to you." />
      <MyPoliciesList tenantId={tenantId} />
    </div>
  );
}
