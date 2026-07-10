'use client';

import { useSession } from '../../session-provider';
import { CreateLeaveTypeForm } from '@/features/leave/create-leave-type-form';
import { LeaveTypesList } from '@/features/leave/leave-types-list';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function LeaveTypesPage() {
  const session = useSession();
  const tenantId = session.tenantId as string;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Leave types</h1>
      <Card>
        <CardHeader>
          <CardTitle>Catalog</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <LeaveTypesList tenantId={tenantId} />
          <CreateLeaveTypeForm tenantId={tenantId} />
        </CardContent>
      </Card>
    </div>
  );
}
