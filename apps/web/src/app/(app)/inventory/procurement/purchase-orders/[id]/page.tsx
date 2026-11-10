'use client';

import { use } from 'react';
import { useSession } from '../../../../session-provider';
import { PurchaseOrderDetail } from '@/features/inventory/purchase-order-detail';

export default function PurchaseOrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const session = useSession();
  const tenantId = session.tenantId as string;

  return <PurchaseOrderDetail tenantId={tenantId} poId={id} />;
}
