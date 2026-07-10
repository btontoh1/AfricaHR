'use client';

import Link from 'next/link';
import { usePayRun, usePayslipsByPayRun } from './queries';
import { PayRunStatusBadge } from './pay-run-status-badge';
import { PayRunLifecycleActions } from './pay-run-lifecycle-actions';
import { getApiErrorMessage } from '@/lib/api-error';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
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
    return (
      <div className="space-y-2">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-32 w-full" />
      </div>
    );
  }

  if (isError || !payRun) {
    return (
      <p className="text-sm text-destructive">{getApiErrorMessage(error, 'Failed to load pay run')}</p>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">
            {payRun.periodStart.slice(0, 10)} – {payRun.periodEnd.slice(0, 10)}
          </h1>
          <p className="text-sm text-muted-foreground">Pay date {payRun.payDate.slice(0, 10)}</p>
        </div>
        <PayRunStatusBadge status={payRun.status} />
      </div>

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
            <p className="text-sm text-muted-foreground">
              No payslips yet — process the pay run to generate them.
            </p>
          )}
          {payslips && payslips.length > 0 && (
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
                    <TableCell>{payslip.netPay}</TableCell>
                    <TableCell>{payslip.currency}</TableCell>
                    <TableCell>
                      <Link href={`/payroll/payslips/${payslip.id}`} className="hover:underline">
                        View
                      </Link>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
