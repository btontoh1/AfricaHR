'use client';

import Link from 'next/link';
import { CalendarPlus } from 'lucide-react';
import { useSession } from '../session-provider';
import { MyLeaveRequestsList } from '@/features/leave/my-leave-requests-list';
import { Button } from '@/components/ui/button';
import { PageHeader } from '@/components/page-header';

export default function LeavePage() {
  const session = useSession();
  const tenantId = session.tenantId as string;

  return (
    <div>
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
      <MyLeaveRequestsList tenantId={tenantId} />
    </div>
  );
}
