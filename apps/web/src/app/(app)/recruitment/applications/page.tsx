'use client';

import { useSession } from '../../session-provider';
import { CreateApplicationForm } from '@/features/recruitment/create-application-form';
import { ApplicationsList } from '@/features/recruitment/applications-list';

export default function ApplicationsPage() {
  const session = useSession();
  const tenantId = session.tenantId as string;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Applications</h1>
      <CreateApplicationForm tenantId={tenantId} />
      <ApplicationsList tenantId={tenantId} />
    </div>
  );
}
