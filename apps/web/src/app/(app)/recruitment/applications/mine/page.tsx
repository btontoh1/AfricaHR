'use client';

import { useSession } from '../../../session-provider';
import { MyApplicationsList } from '@/features/recruitment/my-applications-list';

export default function MyApplicationsPage() {
  const session = useSession();
  const tenantId = session.tenantId as string;

  return (
    <div>
      <h1 className="mb-6 text-2xl font-semibold">My applications</h1>
      <MyApplicationsList tenantId={tenantId} />
    </div>
  );
}
