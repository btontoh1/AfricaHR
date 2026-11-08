'use client';

import Link from 'next/link';
import { Plus } from 'lucide-react';
import { useSession } from '../session-provider';
import { useVendorBills } from '@/features/vendor-bills/queries';
import { BillsList } from '@/features/vendor-bills/bills-list';
import { PageHeader } from '@/components/page-header';
import { Button } from '@/components/ui/button';

export default function VendorBillsPage() {
  const session = useSession();
  const tenantId = session.tenantId as string;
  const { data: bills } = useVendorBills(tenantId);

  return (
    <div>
      <PageHeader
        title="Bills"
        description={bills ? `${bills.length} bill${bills.length === 1 ? '' : 's'}` : undefined}
        action={
          <Button asChild>
            <Link href="/vendor-bills/new">
              <Plus className="size-4" />
              New bill
            </Link>
          </Button>
        }
      />
      <BillsList tenantId={tenantId} />
    </div>
  );
}
