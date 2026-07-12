import { CreateOrganizationForm } from '@/features/organizations/create-organization-form';
import { PageHeader } from '@/components/page-header';

export default function NewOrganizationPage() {
  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader title="Add organization" description="Register a new organization." />
      <CreateOrganizationForm />
    </div>
  );
}
