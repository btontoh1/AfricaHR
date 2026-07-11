'use client';

import { useSession } from '../../session-provider';
import { PayrollCostReport } from '@/features/reporting/payroll-cost-report';

export default function PayrollCostReportPage() {
  const session = useSession();
  const tenantId = session.tenantId as string;

  return (
    <div>
      <h1 className="mb-6 text-2xl font-semibold">Payroll cost</h1>
      <PayrollCostReport tenantId={tenantId} />
    </div>
  );
}
