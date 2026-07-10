'use client';

import { use } from 'react';
import { useSession } from '../../../session-provider';
import { AttendanceRecordDetail } from '@/features/attendance/attendance-record-detail';

export default function AttendanceRecordDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const session = useSession();
  const tenantId = session.tenantId as string;

  return <AttendanceRecordDetail tenantId={tenantId} recordId={id} />;
}
