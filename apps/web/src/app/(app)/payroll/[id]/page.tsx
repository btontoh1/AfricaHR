'use client';

import { use } from 'react';
import { useSession } from '../../session-provider';
import { PayRunDetail } from '@/features/payroll/pay-run-detail';

export default function PayRunDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const session = useSession();
  const tenantId = session.tenantId as string;

  return <PayRunDetail tenantId={tenantId} payRunId={id} />;
}
