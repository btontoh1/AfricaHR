import { CreateOrganizationForm } from '@/features/organizations/create-organization-form';

export default function NewOrganizationPage() {
  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="mb-6 text-2xl font-semibold">Add organization</h1>
      <CreateOrganizationForm />
    </div>
  );
}
