'use client';

import { HomeCurrencyCard } from './home-currency-card';
import { RunFxRevaluationDialog } from './run-fx-revaluation-dialog';
import { FxRevaluationsList } from './fx-revaluations-list';

export function FxRevaluationView({ tenantId }: { tenantId: string }) {
  return (
    <div className="space-y-6">
      <HomeCurrencyCard tenantId={tenantId} />

      <div className="flex justify-end">
        <RunFxRevaluationDialog tenantId={tenantId} />
      </div>

      <FxRevaluationsList tenantId={tenantId} />
    </div>
  );
}
