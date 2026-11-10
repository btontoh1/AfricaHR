'use client';

import { useSession } from '../../../session-provider';
import { MyCompanyAssetsList } from '@/features/inventory/my-company-assets-list';
import { PageHeader } from '@/components/page-header';

export default function MyCompanyAssetsPage() {
  const session = useSession();
  const tenantId = session.tenantId as string;

  return (
    <div>
      <PageHeader title="My assets" description="Company equipment currently or previously assigned to you" />
      <MyCompanyAssetsList tenantId={tenantId} />
    </div>
  );
}
