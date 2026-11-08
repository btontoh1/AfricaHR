'use client';

import { use } from 'react';
import { useSession } from '../../session-provider';
import { InvoiceDetail } from '@/features/invoices/invoice-detail';

export default function InvoiceDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const session = useSession();
  const tenantId = session.tenantId as string;

  return <InvoiceDetail tenantId={tenantId} invoiceId={id} />;
}
