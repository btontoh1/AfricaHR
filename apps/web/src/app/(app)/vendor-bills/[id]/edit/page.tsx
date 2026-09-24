'use client';

import { use } from 'react';
import { useSession } from '../../../session-provider';
import { useVendorBill } from '@/features/vendor-bills/queries';
import { BillForm } from '@/features/vendor-bills/bill-form';
import { PageHeader } from '@/components/page-header';
import { CardSkeleton } from '@/components/loading-state';
import { ErrorState } from '@/components/error-state';
import { getApiErrorMessage } from '@/lib/api-error';

export default function EditVendorBillPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const session = useSession();
  const tenantId = session.tenantId as string;
  const { data: bill, isLoading, isError, error } = useVendorBill(tenantId, id);

  if (isLoading) {
    return <CardSkeleton />;
  }

  if (isError || !bill) {
    return <ErrorState message={getApiErrorMessage(error, 'Failed to load bill')} />;
  }

  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader title="Edit bill" description={bill.billNumber} />
      <BillForm tenantId={tenantId} bill={bill} />
    </div>
  );
}
