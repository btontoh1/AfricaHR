'use client';

import { use } from 'react';
import { useSession } from '../../session-provider';
import { MyPayslipDetail } from '@/features/payroll/my-payslip-detail';
import { PageHeader } from '@/components/page-header';

export default function PayslipDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const session = useSession();
  const tenantId = session.tenantId as string;

  return (
    <div className="space-y-6">
      <PageHeader title="Payslip" description="Your pay breakdown for this pay run." />
      <MyPayslipDetail tenantId={tenantId} payslipId={id} />
    </div>
  );
}
