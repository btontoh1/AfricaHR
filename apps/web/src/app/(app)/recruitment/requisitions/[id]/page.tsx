'use client';

import { use } from 'react';
import { useSession } from '../../../session-provider';
import { RequisitionDetail } from '@/features/recruitment/requisition-detail';

export default function RequisitionDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const session = useSession();
  const tenantId = session.tenantId as string;

  return <RequisitionDetail tenantId={tenantId} requisitionId={id} tier="hr" />;
}
