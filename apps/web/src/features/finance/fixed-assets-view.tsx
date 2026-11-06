'use client';

import { CreateFixedAssetDialog } from './create-fixed-asset-dialog';
import { RunDepreciationDialog } from './run-depreciation-dialog';
import { FixedAssetsList } from './fixed-assets-list';
import { DepreciationRunsList } from './depreciation-runs-list';

export function FixedAssetsView({ tenantId }: { tenantId: string }) {
  return (
    <div className="space-y-8">
      <div className="flex justify-end gap-3">
        <RunDepreciationDialog tenantId={tenantId} />
        <CreateFixedAssetDialog tenantId={tenantId} />
      </div>

      <FixedAssetsList tenantId={tenantId} />

      <div>
        <h2 className="mb-4 text-lg font-semibold">Depreciation runs</h2>
        <DepreciationRunsList tenantId={tenantId} />
      </div>
    </div>
  );
}
