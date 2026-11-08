'use client';

import { use } from 'react';
import { useSession } from '../../../session-provider';
import { BankReconciliationDetail } from '@/features/finance/bank-reconciliation-detail';

export default function BankReconciliationDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const session = useSession();
  const tenantId = session.tenantId as string;

  return <BankReconciliationDetail tenantId={tenantId} reconciliationId={id} />;
}
