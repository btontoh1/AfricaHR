'use client';

import { use } from 'react';
import { useSession } from '../../../session-provider';
import { PayslipDetail } from '@/features/payroll/payslip-detail';

export default function PayslipDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const session = useSession();
  const tenantId = session.tenantId as string;

  return <PayslipDetail tenantId={tenantId} payslipId={id} />;
}
