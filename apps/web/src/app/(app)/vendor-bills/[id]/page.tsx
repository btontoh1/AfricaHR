'use client';

import { use } from 'react';
import { useSession } from '../../session-provider';
import { BillDetail } from '@/features/vendor-bills/bill-detail';

export default function VendorBillDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const session = useSession();
  const tenantId = session.tenantId as string;

  return <BillDetail tenantId={tenantId} billId={id} />;
}
