'use client';

import { useSession } from '../session-provider';
import { PaymentMethodForm } from '@/features/employees/payment-method-form';
import { PageHeader } from '@/components/page-header';

export default function PaymentMethodPage() {
  const session = useSession();
  const tenantId = session.tenantId as string;

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <PageHeader title="Payment details" description="Tell us how you'd like to be paid." />
      <PaymentMethodForm tenantId={tenantId} />
    </div>
  );
}
