'use client';

import { useSession } from '../../session-provider';
import { PayrollCostReport } from '@/features/reporting/payroll-cost-report';
import { PageHeader } from '@/components/page-header';

export default function PayrollCostReportPage() {
  const session = useSession();
  const tenantId = session.tenantId as string;

  return (
    <div>
      <PageHeader title="Payroll cost" description="Total payroll spend across completed pay runs." />
      <PayrollCostReport tenantId={tenantId} />
    </div>
  );
}
