'use client';

import Link from 'next/link';
import { ArrowRight, ClipboardCheck } from 'lucide-react';
import { useLeaveRequests } from './queries';
import { useEmployees } from '@/features/employees/queries';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CardSkeleton } from '@/components/loading-state';

const PREVIEW_LIMIT = 5;

/**
 * Dashboard visibility for the same audience that can act on these — the
 * leave-approval queue itself is gated to TENANT_ADMIN/HR_MANAGER (see
 * hasLeaveAdminAccess in nav-config.ts), so this card only ever renders
 * for those roles too (see DashboardPage).
 */
export function PendingLeaveRequestsCard({ tenantId }: { tenantId: string }) {
  const { data: requests, isLoading } = useLeaveRequests(tenantId, 'PENDING');
  const { data: employees } = useEmployees(tenantId);

  const employeeName = (id: string) => {
    const employee = employees?.find((e) => e.id === id);
    return employee ? `${employee.firstName} ${employee.lastName}` : id;
  };

  if (isLoading) {
    return <CardSkeleton />;
  }

  const pending = requests ?? [];

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between gap-2">
        <CardTitle className="flex items-center gap-2 text-base">
          <ClipboardCheck className="size-4 text-muted-foreground" />
          Pending leave requests
        </CardTitle>
        {pending.length > 0 && <Badge variant="warning">{pending.length}</Badge>}
      </CardHeader>
      <CardContent>
        {pending.length === 0 ? (
          <p className="text-sm text-muted-foreground">Nothing waiting on you right now.</p>
        ) : (
          <div className="space-y-2">
            {pending.slice(0, PREVIEW_LIMIT).map((request) => (
              <div key={request.id} className="flex items-center justify-between text-sm">
                <span className="font-medium">{employeeName(request.employeeId)}</span>
                <span className="text-muted-foreground">
                  {request.startDate.slice(0, 10)} – {request.endDate.slice(0, 10)}
                </span>
              </div>
            ))}
            {pending.length > PREVIEW_LIMIT && (
              <p className="text-xs text-muted-foreground">
                +{pending.length - PREVIEW_LIMIT} more
              </p>
            )}
          </div>
        )}
        <Link
          href="/leave/requests"
          className="mt-3 inline-flex items-center gap-1 text-sm text-primary hover:underline"
        >
          Review requests <ArrowRight className="size-3.5" />
        </Link>
      </CardContent>
    </Card>
  );
}
