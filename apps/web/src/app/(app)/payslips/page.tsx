'use client';

import { useSession } from '../session-provider';
import { MyPayslipsTable } from '@/features/payroll/my-payslips-table';
import { PageHeader } from '@/components/page-header';

export default function PayslipsPage() {
  const session = useSession();
  const tenantId = session.tenantId as string;

  return (
    <div className="space-y-6">
      <PageHeader title="My payslips" description="View your pay history and the breakdown behind each payslip." />
      <MyPayslipsTable tenantId={tenantId} />
    </div>
  );
}
