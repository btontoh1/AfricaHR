'use client';

import Link from 'next/link';
import { Receipt } from 'lucide-react';
import { usePayRun, usePayslipsByPayRun } from './queries';
import { PayRunStatusBadge } from './pay-run-status-badge';
import { PayRunLifecycleActions } from './pay-run-lifecycle-actions';
import { getApiErrorMessage } from '@/lib/api-error';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CardSkeleton } from '@/components/loading-state';
import { ErrorState } from '@/components/error-state';
import { EmptyState } from '@/components/empty-state';
import { PageHeader } from '@/components/page-header';
import { TableCard } from '@/components/table-card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

function Field({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="text-sm">{value ?? '—'}</div>
    </div>
  );
}

export function PayRunDetail({ tenantId, payRunId }: { tenantId: string; payRunId: string }) {
  const { data: payRun, isLoading, isError, error } = usePayRun(tenantId, payRunId);
  const { data: payslips } = usePayslipsByPayRun(tenantId, payRunId);

  if (isLoading) {
    return <CardSkeleton />;
  }

  if (isError || !payRun) {
    return <ErrorState message={getApiErrorMessage(error, 'Failed to load pay run')} />;
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={`${payRun.periodStart.slice(0, 10)} – ${payRun.periodEnd.slice(0, 10)}`}
        description={`Pay date ${payRun.payDate.slice(0, 10)}`}
        action={<PayRunStatusBadge status={payRun.status} />}
      />

      <PayRunLifecycleActions tenantId={tenantId} payRun={payRun} />

      <Card>
        <CardHeader>
          <CardTitle>Details</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-3">
          <Field label="Organization" value={payRun.organizationId} />
          <Field label="Approved at" value={payRun.approvedAt?.slice(0, 19).replace('T', ' ')} />
          <Field label="Paid at" value={payRun.paidAt?.slice(0, 19).replace('T', ' ')} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Payslips</CardTitle>
        </CardHeader>
        <CardContent>
          {payslips && payslips.length === 0 && (
            <EmptyState
              icon={Receipt}
              title="No payslips yet"
              description="Process the pay run to generate them."
            />
          )}
          {payslips && payslips.length > 0 && (
            <TableCard>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Employee</TableHead>
                    <TableHead>Gross pay</TableHead>
                    <TableHead>Net pay</TableHead>
                    <TableHead>Currency</TableHead>
                    <TableHead />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {payslips.map((payslip) => (
                    <TableRow key={payslip.id}>
                      <TableCell className="font-mono text-xs">{payslip.employeeId}</TableCell>
                      <TableCell>{payslip.grossPay}</TableCell>
                      <TableCell className="font-medium">{payslip.netPay}</TableCell>
                      <TableCell className="text-muted-foreground">{payslip.currency}</TableCell>
                      <TableCell>
                        <Link href={`/payroll/payslips/${payslip.id}`} className="text-sm text-primary hover:underline">
                          View
                        </Link>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableCard>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
