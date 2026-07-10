'use client';

import Link from 'next/link';
import { useSession } from '../session-provider';
import { usePayRuns } from '@/features/payroll/queries';
import { PayRunStatusBadge } from '@/features/payroll/pay-run-status-badge';
import { getApiErrorMessage } from '@/lib/api-error';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

export default function PayrollPage() {
  const session = useSession();
  const tenantId = session.tenantId as string;
  const { data: payRuns, isLoading, isError, error } = usePayRuns(tenantId);

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Pay runs</h1>
          <p className="text-sm text-muted-foreground">
            {payRuns ? `${payRuns.length} pay run${payRuns.length === 1 ? '' : 's'}` : ' '}
          </p>
        </div>
        <Button asChild>
          <Link href="/payroll/new">New pay run</Link>
        </Button>
      </div>

      {isLoading && (
        <div className="space-y-2">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
        </div>
      )}

      {isError && (
        <p className="text-sm text-destructive">{getApiErrorMessage(error, 'Failed to load pay runs')}</p>
      )}

      {payRuns && payRuns.length === 0 && (
        <p className="text-sm text-muted-foreground">No pay runs yet.</p>
      )}

      {payRuns && payRuns.length > 0 && (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Period</TableHead>
              <TableHead>Pay date</TableHead>
              <TableHead>Organization</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {payRuns.map((payRun) => (
              <TableRow key={payRun.id}>
                <TableCell>
                  <Link href={`/payroll/${payRun.id}`} className="hover:underline">
                    {payRun.periodStart.slice(0, 10)} – {payRun.periodEnd.slice(0, 10)}
                  </Link>
                </TableCell>
                <TableCell>{payRun.payDate.slice(0, 10)}</TableCell>
                <TableCell className="font-mono text-xs">{payRun.organizationId}</TableCell>
                <TableCell>
                  <PayRunStatusBadge status={payRun.status} />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  );
}
