'use client';

import { useSession } from '../../session-provider';
import { StockRequestsList } from '@/features/inventory/stock-requests-list';
import { PageHeader } from '@/components/page-header';

export default function InventoryStockRequestsPage() {
  const session = useSession();
  const tenantId = session.tenantId as string;

  return (
    <div>
      <PageHeader title="Stock requests" description="Review and fulfill employee stock requests" />
      <StockRequestsList tenantId={tenantId} />
    </div>
  );
}
