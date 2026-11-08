'use client';

import { useSession } from '../../session-provider';
import { BillForm } from '@/features/vendor-bills/bill-form';
import { PageHeader } from '@/components/page-header';

export default function NewVendorBillPage() {
  const session = useSession();
  const tenantId = session.tenantId as string;

  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader title="New bill" description="Record a bill from a vendor." />
      <BillForm tenantId={tenantId} />
    </div>
  );
}
