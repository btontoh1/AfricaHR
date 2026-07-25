'use client';

import Link from 'next/link';
import { Banknote, Plus } from 'lucide-react';
import { useSession } from '../session-provider';
import { usePayRuns } from '@/features/payroll/queries';
import { useOrganizations } from '@/features/organizations/queries';
import { PayRunStatusBadge } from '@/features/payroll/pay-run-status-badge';
import { getApiErrorMessage } from '@/lib/api-error';
import { Button } from '@/components/ui/button';
import { PageHeader } from '@/components/page-header';
import { TableCard } from '@/components/table-card';
import { EmptyState } from '@/components/empty-state';
import { TableSkeleton } from '@/components/loading-state';
import { ErrorState } from '@/components/error-state';
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
  const { data: organizations } = useOrganizations(tenantId);
  const organizationName = (id: string) => organizations?.find((org) => org.id === id)?.legalName ?? id;

  return (
    <div>
      <PageHeader
        title="Pay runs"
        description={payRuns ? `${payRuns.length} pay run${payRuns.length === 1 ? '' : 's'}` : undefined}
        action={
          <Button asChild>
            <Link href="/payroll/new">
              <Plus className="size-4" />
              New pay run
            </Link>
          </Button>
        }
      />

      {isLoading && <TableSkeleton />}

      {isError && <ErrorState message={getApiErrorMessage(error, 'Failed to load pay runs')} />}

      {payRuns && payRuns.length === 0 && (
        <EmptyState
          icon={Banknote}
          title="No pay runs yet"
          description="Create your first pay run to get started."
          action={
            <Button asChild size="sm">
              <Link href="/payroll/new">
                <Plus className="size-4" />
                New pay run
              </Link>
            </Button>
          }
        />
      )}

      {payRuns && payRuns.length > 0 && (
        <TableCard>
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
                    <Link href={`/payroll/${payRun.id}`} className="font-medium hover:underline">
                      {payRun.periodStart.slice(0, 10)} – {payRun.periodEnd.slice(0, 10)}
                    </Link>
                  </TableCell>
                  <TableCell className="text-muted-foreground">{payRun.payDate.slice(0, 10)}</TableCell>
                  <TableCell className="text-muted-foreground">{organizationName(payRun.organizationId)}</TableCell>
                  <TableCell>
                    <PayRunStatusBadge status={payRun.status} />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableCard>
      )}
    </div>
  );
}
