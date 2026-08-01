import { CreateTenantForm } from '@/features/platform-tenants/create-tenant-form';
import { PageHeader } from '@/components/page-header';

export default function NewTenantPage() {
  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader title="Add tenant" description="Create a new tenant and its first administrator account." />
      <CreateTenantForm />
    </div>
  );
}
