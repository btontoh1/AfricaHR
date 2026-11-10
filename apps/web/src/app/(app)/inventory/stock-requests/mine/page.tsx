'use client';

import { useSession } from '../../../session-provider';
import { CreateMyStockRequestDialog } from '@/features/inventory/create-my-stock-request-dialog';
import { MyStockRequestsList } from '@/features/inventory/my-stock-requests-list';
import { PageHeader } from '@/components/page-header';

export default function MyStockRequestsPage() {
  const session = useSession();
  const tenantId = session.tenantId as string;

  return (
    <div>
      <PageHeader
        title="My stock requests"
        description="Request stock from your warehouse and track its status"
        action={<CreateMyStockRequestDialog tenantId={tenantId} />}
      />
      <MyStockRequestsList tenantId={tenantId} />
    </div>
  );
}
