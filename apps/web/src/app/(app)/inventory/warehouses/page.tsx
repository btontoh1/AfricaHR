'use client';

import { useSession } from '../../session-provider';
import { useInventoryWarehouses } from '@/features/inventory/queries';
import { CreateWarehouseDialog } from '@/features/inventory/create-warehouse-dialog';
import { WarehousesList } from '@/features/inventory/warehouses-list';
import { PageHeader } from '@/components/page-header';

export default function InventoryWarehousesPage() {
  const session = useSession();
  const tenantId = session.tenantId as string;
  const { data: warehouses } = useInventoryWarehouses(tenantId);

  return (
    <div>
      <PageHeader
        title="Warehouses"
        description={
          warehouses ? `${warehouses.length} warehouse${warehouses.length === 1 ? '' : 's'}` : undefined
        }
        action={<CreateWarehouseDialog tenantId={tenantId} />}
      />
      <WarehousesList tenantId={tenantId} />
    </div>
  );
}
