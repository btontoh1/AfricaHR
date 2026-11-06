'use client';

import { useSession } from '../../session-provider';
import { FxRevaluationView } from '@/features/finance/fx-revaluation-view';
import { PageHeader } from '@/components/page-header';

export default function FxRevaluationPage() {
  const session = useSession();
  const tenantId = session.tenantId as string;

  return (
    <div>
      <PageHeader
        title="FX Revaluation"
        description="Revalue foreign-currency monetary balances against each organization's home currency and post the unrealized gain or loss."
      />
      <FxRevaluationView tenantId={tenantId} />
    </div>
  );
}
