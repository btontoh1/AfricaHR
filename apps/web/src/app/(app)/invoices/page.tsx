'use client';

import Link from 'next/link';
import { Plus } from 'lucide-react';
import { useSession } from '../session-provider';
import { useInvoices } from '@/features/invoices/queries';
import { InvoicesList } from '@/features/invoices/invoices-list';
import { PageHeader } from '@/components/page-header';
import { Button } from '@/components/ui/button';

export default function InvoicesPage() {
  const session = useSession();
  const tenantId = session.tenantId as string;
  const { data: invoices } = useInvoices(tenantId);

  return (
    <div>
      <PageHeader
        title="Invoices"
        description={invoices ? `${invoices.length} invoice${invoices.length === 1 ? '' : 's'}` : undefined}
        action={
          <Button asChild>
            <Link href="/invoices/new">
              <Plus className="size-4" />
              New invoice
            </Link>
          </Button>
        }
      />
      <InvoicesList tenantId={tenantId} />
    </div>
  );
}
