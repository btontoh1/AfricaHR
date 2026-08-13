'use client';

import { use } from 'react';
import { useSession } from '../../../session-provider';
import { useInvoice } from '@/features/invoices/queries';
import { InvoiceForm } from '@/features/invoices/invoice-form';
import { PageHeader } from '@/components/page-header';
import { CardSkeleton } from '@/components/loading-state';
import { ErrorState } from '@/components/error-state';
import { getApiErrorMessage } from '@/lib/api-error';

export default function EditInvoicePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const session = useSession();
  const tenantId = session.tenantId as string;
  const { data: invoice, isLoading, isError, error } = useInvoice(tenantId, id);

  if (isLoading) {
    return <CardSkeleton />;
  }

  if (isError || !invoice) {
    return <ErrorState message={getApiErrorMessage(error, 'Failed to load invoice')} />;
  }

  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader title="Edit invoice" description={invoice.invoiceNumber} />
      <InvoiceForm tenantId={tenantId} invoice={invoice} />
    </div>
  );
}
