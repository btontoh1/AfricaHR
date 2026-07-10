'use client';

import { use } from 'react';
import { useSession } from '../../session-provider';
import { EmployeeDetail } from '@/features/employees/employee-detail';

export default function EmployeeDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const session = useSession();
  const tenantId = session.tenantId as string;

  return <EmployeeDetail tenantId={tenantId} employeeId={id} />;
}
