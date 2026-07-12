import { CreatePayRunForm } from '@/features/payroll/create-pay-run-form';
import { PageHeader } from '@/components/page-header';

export default function NewPayRunPage() {
  return (
    <div className="mx-auto max-w-2xl">
      <PageHeader title="New pay run" description="Start a new payroll processing cycle." />
      <CreatePayRunForm />
    </div>
  );
}
