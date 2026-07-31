'use client';

import Link from 'next/link';
import { ArrowRight, Users2 } from 'lucide-react';
import { useTeamLeaveRequests } from './queries';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const PREVIEW_LIMIT = 5;

/**
 * Unlike PendingLeaveRequestsCard (HR/Admin, always shown), this is visible
 * to every tenant member — most of whom aren't anyone's manager — so it
 * renders nothing at all rather than an empty state, to avoid cluttering
 * the dashboard of every employee who has no direct reports.
 */
export function TeamPendingLeaveRequestsCard({ tenantId }: { tenantId: string }) {
  const { data: requests, isLoading } = useTeamLeaveRequests(tenantId);
  const pending = (requests ?? []).filter((request) => request.status === 'PENDING');

  if (isLoading || pending.length === 0) {
    return null;
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between gap-2">
        <CardTitle className="flex items-center gap-2 text-base">
          <Users2 className="size-4 text-muted-foreground" />
          Your team needs a decision
        </CardTitle>
        <Badge variant="warning">{pending.length}</Badge>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {pending.slice(0, PREVIEW_LIMIT).map((request) => (
            <div key={request.id} className="flex items-center justify-between text-sm">
              <span className="font-medium">{request.employeeName}</span>
              <span className="text-muted-foreground">
                {request.startDate.slice(0, 10)} – {request.endDate.slice(0, 10)}
              </span>
            </div>
          ))}
          {pending.length > PREVIEW_LIMIT && (
            <p className="text-xs text-muted-foreground">+{pending.length - PREVIEW_LIMIT} more</p>
          )}
        </div>
        <Link
          href="/leave/requests/team"
          className="mt-3 inline-flex items-center gap-1 text-sm text-primary hover:underline"
        >
          Review requests <ArrowRight className="size-3.5" />
        </Link>
      </CardContent>
    </Card>
  );
}
