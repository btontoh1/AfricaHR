'use client';

import { useSession } from '../session-provider';
import { useVendors } from '@/features/vendors/queries';
import { CreateVendorDialog } from '@/features/vendors/create-vendor-dialog';
import { VendorsList } from '@/features/vendors/vendors-list';
import { PageHeader } from '@/components/page-header';

export default function VendorsPage() {
  const session = useSession();
  const tenantId = session.tenantId as string;
  const { data: vendors } = useVendors(tenantId);

  return (
    <div>
      <PageHeader
        title="Vendors"
        description={vendors ? `${vendors.length} vendor${vendors.length === 1 ? '' : 's'}` : undefined}
        action={<CreateVendorDialog tenantId={tenantId} />}
      />
      <VendorsList tenantId={tenantId} />
    </div>
  );
}
