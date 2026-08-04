'use client';

import Link from 'next/link';
import { CalendarPlus } from 'lucide-react';
import { useSession } from '../session-provider';
import { MyLeaveRequestsList } from '@/features/leave/my-leave-requests-list';
import { MyLeaveBalances } from '@/features/leave/my-leave-balances';
import { Button } from '@/components/ui/button';
import { PageHeader } from '@/components/page-header';

export default function LeavePage() {
  const session = useSession();
  const tenantId = session.tenantId as string;

  return (
    <div className="space-y-6">
      <PageHeader
        title="My leave requests"
        action={
          <Button asChild>
            <Link href="/leave/new">
              <CalendarPlus className="size-4" />
              Request leave
            </Link>
          </Button>
        }
      />
      <MyLeaveBalances tenantId={tenantId} />
      <MyLeaveRequestsList tenantId={tenantId} />
    </div>
  );
}
