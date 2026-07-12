import { RequestLeaveForm } from '@/features/leave/request-leave-form';
import { PageHeader } from '@/components/page-header';

export default function NewLeaveRequestPage() {
  return (
    <div className="mx-auto max-w-2xl">
      <PageHeader title="Request leave" description="Submit a new time-off request." />
      <RequestLeaveForm />
    </div>
  );
}
