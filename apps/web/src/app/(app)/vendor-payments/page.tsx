'use client';

import { useSearchParams } from 'next/navigation';
import { useSession } from '../session-provider';
import { VendorPaymentsView } from '@/features/vendor-payments/vendor-payments-view';
import { PageHeader } from '@/components/page-header';

export default function VendorPaymentsPage() {
  const session = useSession();
  const tenantId = session.tenantId as string;
  const searchParams = useSearchParams();
  const defaultVendorId = searchParams.get('vendorId') ?? undefined;

  return (
    <div>
      <PageHeader title="Vendor Payments" description="Record payments and allocate them across a vendor's open bills." />
      <VendorPaymentsView tenantId={tenantId} defaultVendorId={defaultVendorId} />
    </div>
  );
}
