'use client';

import { useSession } from '../../../session-provider';
import { MyApplicationsList } from '@/features/recruitment/my-applications-list';
import { PageHeader } from '@/components/page-header';

export default function MyApplicationsPage() {
  const session = useSession();
  const tenantId = session.tenantId as string;

  return (
    <div>
      <PageHeader title="My applications" description="Applications for requisitions you manage." />
      <MyApplicationsList tenantId={tenantId} />
    </div>
  );
}
