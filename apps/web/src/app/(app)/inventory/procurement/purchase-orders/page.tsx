'use client';

import { useSession } from '../../../session-provider';
import { CreatePurchaseOrderDialog } from '@/features/inventory/create-purchase-order-dialog';
import { PurchaseOrdersList } from '@/features/inventory/purchase-orders-list';
import { PageHeader } from '@/components/page-header';

export default function InventoryPurchaseOrdersPage() {
  const session = useSession();
  const tenantId = session.tenantId as string;

  return (
    <div>
      <PageHeader
        title="Purchase orders"
        description="Orders raised against vendors for your warehouses"
        action={<CreatePurchaseOrderDialog tenantId={tenantId} />}
      />
      <PurchaseOrdersList tenantId={tenantId} />
    </div>
  );
}
