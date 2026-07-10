import { CreateEmployeeForm } from '@/features/employees/create-employee-form';

export default function NewEmployeePage() {
  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="mb-6 text-2xl font-semibold">Add employee</h1>
      <CreateEmployeeForm />
    </div>
  );
}
