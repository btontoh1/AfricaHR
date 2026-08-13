'use client';

import { useSession } from '../../session-provider';
import { InvoiceForm } from '@/features/invoices/invoice-form';
import { PageHeader } from '@/components/page-header';

export default function NewInvoicePage() {
  const session = useSession();
  const tenantId = session.tenantId as string;

  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader title="New invoice" description="Create an invoice for a customer." />
      <InvoiceForm tenantId={tenantId} />
    </div>
  );
}
