'use client';

import { useSession } from '../../session-provider';
import { BankReconciliationsView } from '@/features/finance/bank-reconciliations-view';
import { PageHeader } from '@/components/page-header';

export default function BankReconciliationsPage() {
  const session = useSession();
  const tenantId = session.tenantId as string;

  return (
    <div>
      <PageHeader
        title="Bank Reconciliation"
        description="Reconcile your Cash and Bank ledger against each bank statement's ending balance."
      />
      <BankReconciliationsView tenantId={tenantId} />
    </div>
  );
}
