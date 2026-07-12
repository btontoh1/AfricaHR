import { CreateEmployeeForm } from '@/features/employees/create-employee-form';
import { PageHeader } from '@/components/page-header';

export default function NewEmployeePage() {
  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader title="Add employee" description="Create a new employee record." />
      <CreateEmployeeForm />
    </div>
  );
}
