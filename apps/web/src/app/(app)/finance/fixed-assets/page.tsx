'use client';

import { useSession } from '../../session-provider';
import { FixedAssetsView } from '@/features/finance/fixed-assets-view';
import { PageHeader } from '@/components/page-header';

export default function FixedAssetsPage() {
  const session = useSession();
  const tenantId = session.tenantId as string;

  return (
    <div>
      <PageHeader
        title="Fixed Assets"
        description="Track fixed assets and their straight-line depreciation over their useful life."
      />
      <FixedAssetsView tenantId={tenantId} />
    </div>
  );
}
