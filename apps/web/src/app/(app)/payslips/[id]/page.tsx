'use client';

import { use } from 'react';
import { Printer } from 'lucide-react';
import { useSession } from '../../session-provider';
import { MyPayslipDetail } from '@/features/payroll/my-payslip-detail';
import { PageHeader } from '@/components/page-header';
import { Button } from '@/components/ui/button';

export default function PayslipDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const session = useSession();
  const tenantId = session.tenantId as string;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Payslip"
        description="Your pay breakdown for this pay run."
        action={
          // The browser's own print dialog offers "Save as PDF", so this
          // one button covers both printing and downloading a PDF copy —
          // no server-side PDF rendering needed.
          <Button variant="outline" onClick={() => window.print()} className="print:hidden">
            <Printer className="size-4" />
            Print / Save as PDF
          </Button>
        }
      />
      <MyPayslipDetail tenantId={tenantId} payslipId={id} />
    </div>
  );
}
