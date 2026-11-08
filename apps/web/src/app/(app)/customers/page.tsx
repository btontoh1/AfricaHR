'use client';

import { useSession } from '../session-provider';
import { useCustomers } from '@/features/customers/queries';
import { CreateCustomerDialog } from '@/features/customers/create-customer-dialog';
import { CustomersList } from '@/features/customers/customers-list';
import { PageHeader } from '@/components/page-header';

export default function CustomersPage() {
  const session = useSession();
  const tenantId = session.tenantId as string;
  const { data: customers } = useCustomers(tenantId);

  return (
    <div>
      <PageHeader
        title="Customers"
        description={customers ? `${customers.length} customer${customers.length === 1 ? '' : 's'}` : undefined}
        action={<CreateCustomerDialog tenantId={tenantId} />}
      />
      <CustomersList tenantId={tenantId} />
    </div>
  );
}
