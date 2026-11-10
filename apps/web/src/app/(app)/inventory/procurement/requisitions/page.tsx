'use client';

import { useSession } from '../../../session-provider';
import { CreateRequisitionDialog } from '@/features/inventory/create-requisition-dialog';
import { RequisitionsList } from '@/features/inventory/requisitions-list';
import { PageHeader } from '@/components/page-header';

export default function InventoryRequisitionsPage() {
  const session = useSession();
  const tenantId = session.tenantId as string;

  return (
    <div>
      <PageHeader
        title="Purchase requisitions"
        description="Request stock for your warehouses before raising a purchase order"
        action={<CreateRequisitionDialog tenantId={tenantId} />}
      />
      <RequisitionsList tenantId={tenantId} />
    </div>
  );
}
