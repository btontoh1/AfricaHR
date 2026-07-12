'use client';

import { useSession } from '../../session-provider';
import { CreateApplicationForm } from '@/features/recruitment/create-application-form';
import { ApplicationsList } from '@/features/recruitment/applications-list';
import { PageHeader } from '@/components/page-header';

export default function ApplicationsPage() {
  const session = useSession();
  const tenantId = session.tenantId as string;

  return (
    <div>
      <PageHeader title="Applications" description="Track candidate applications through the hiring pipeline." />
      <div className="space-y-6">
        <CreateApplicationForm tenantId={tenantId} />
        <ApplicationsList tenantId={tenantId} />
      </div>
    </div>
  );
}
