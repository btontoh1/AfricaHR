'use client';

import { useSession } from '../../session-provider';
import { CreateCompanyAssetDialog } from '@/features/inventory/create-company-asset-dialog';
import { CompanyAssetsList } from '@/features/inventory/company-assets-list';
import { PageHeader } from '@/components/page-header';

export default function CompanyAssetsPage() {
  const session = useSession();
  const tenantId = session.tenantId as string;

  return (
    <div>
      <PageHeader
        title="Company assets"
        description="Track equipment and assign it to employees"
        action={<CreateCompanyAssetDialog tenantId={tenantId} />}
      />
      <CompanyAssetsList tenantId={tenantId} />
    </div>
  );
}
