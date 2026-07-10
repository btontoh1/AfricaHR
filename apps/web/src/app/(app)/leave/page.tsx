'use client';

import Link from 'next/link';
import { useSession } from '../session-provider';
import { MyLeaveRequestsList } from '@/features/leave/my-leave-requests-list';
import { Button } from '@/components/ui/button';

export default function LeavePage() {
  const session = useSession();
  const tenantId = session.tenantId as string;

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-semibold">My leave requests</h1>
        <Button asChild>
          <Link href="/leave/new">Request leave</Link>
        </Button>
      </div>
      <MyLeaveRequestsList tenantId={tenantId} />
    </div>
  );
}
