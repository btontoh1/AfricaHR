'use client';

import Link from 'next/link';
import { Receipt } from 'lucide-react';
import { toast } from 'sonner';
import { usePayRun, usePayslipsByPayRun, useRetryDisbursement } from './queries';
import { useOrganization } from '@/features/organizations/queries';
import { useSession } from '@/app/(app)/session-provider';
import { PayRunStatusBadge } from './pay-run-status-badge';
import { PayRunLifecycleActions } from './pay-run-lifecycle-actions';
import { PayRunStageTracker } from './pay-run-stage-tracker';
import { DisbursementStatusBadge } from './disbursement-status-badge';
import { getApiErrorMessage } from '@/lib/api-error';
import { formatCurrency } from '@/lib/format-currency';
import { Button } from '@/components/ui/button';
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
import type { Payslip } from './types';

function Field({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="text-sm">{value ?? '—'}</div>
    </div>
  );
}

const MANAGE_TIER_ROLES = new Set(['PLATFORM_ADMIN', 'TENANT_ADMIN', 'PAYROLL_MANAGER']);

/** One-line roll-up of where every employee's payment stands - lets a payroll officer tell "all sent" from "needs attention" without reading every row. */
function DisbursementSummary({ payslips }: { payslips: Payslip[] }) {
  const counts = { SUCCESS: 0, PENDING: 0, FAILED: 0, NOT_INITIATED: 0 };
  for (const payslip of payslips) {
    counts[payslip.disbursementStatus] += 1;
  }

  if (counts.FAILED === 0 && counts.PENDING === 0) {
    return (
      <p className="text-sm text-success">
        All {counts.SUCCESS} payment{counts.SUCCESS === 1 ? '' : 's'} sent successfully.
      </p>
    );
  }

  const parts: string[] = [];
  if (counts.SUCCESS > 0) parts.push(`${counts.SUCCESS} sent`);
  if (counts.PENDING > 0) parts.push(`${counts.PENDING} still sending`);
  if (counts.FAILED > 0) parts.push(`${counts.FAILED} failed — needs attention`);
  if (counts.NOT_INITIATED > 0) parts.push(`${counts.NOT_INITIATED} not sent`);

  return (
    <p className={counts.FAILED > 0 ? 'text-sm font-medium text-destructive' : 'text-sm text-muted-foreground'}>
      {parts.join(' · ')}
    </p>
  );
}

function RetryDisbursementButton({ tenantId, payRunId, payslipId }: { tenantId: string; payRunId: string; payslipId: string }) {
  const retry = useRetryDisbursement(tenantId, payRunId);
  return (
    <Button
      size="sm"
      variant="outline"
      disabled={retry.isPending}
      onClick={async () => {
        try {
          await retry.mutateAsync(payslipId);
          toast.success('Retrying payment via Paystack');
        } catch (error) {
          toast.error(getApiErrorMessage(error, 'Failed to retry payment'));
        }
      }}
    >
      {retry.isPending ? 'Retrying…' : 'Retry payment'}
    </Button>
  );
}

export function PayRunDetail({ tenantId, payRunId }: { tenantId: string; payRunId: string }) {
  const { data: payRun, isLoading, isError, error } = usePayRun(tenantId, payRunId);
  const { data: payslips } = usePayslipsByPayRun(tenantId, payRunId);
  const { data: organization } = useOrganization(tenantId, payRun?.organizationId ?? '');
  const { role } = useSession();
  const canManage = MANAGE_TIER_ROLES.has(role);

  if (isLoading) {
    return <CardSkeleton />;
  }

  if (isError || !payRun) {
    return <ErrorState message={getApiErrorMessage(error, 'Failed to load pay run')} />;
  }

  // Disbursement only becomes meaningful once payments have actually been
  // sent - showing "Not sent" badges on every row before that point would
  // read as a problem rather than the normal pre-payment state.
  const showDisbursement = payRun.status === 'PAID' || payRun.status === 'CLOSED';

  return (
    <div className="space-y-6">
      <PageHeader
        title={`${payRun.periodStart.slice(0, 10)} – ${payRun.periodEnd.slice(0, 10)}`}
        description={`Pay date ${payRun.payDate.slice(0, 10)}`}
        backHref="/payroll"
        action={<PayRunStatusBadge status={payRun.status} />}
      />

      <PayRunStageTracker status={payRun.status} />

      <PayRunLifecycleActions tenantId={tenantId} payRun={payRun} />

      <Card>
        <CardHeader>
          <CardTitle>Details</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-3">
          <Field label="Organization" value={organization?.legalName} />
          <Field label="Approved at" value={payRun.approvedAt?.slice(0, 19).replace('T', ' ')} />
          <Field label="Paid at" value={payRun.paidAt?.slice(0, 19).replace('T', ' ')} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Payslips</CardTitle>
          {showDisbursement && payslips && payslips.length > 0 && <DisbursementSummary payslips={payslips} />}
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
                    {showDisbursement && <TableHead>Payment via Paystack</TableHead>}
                    <TableHead />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {payslips.map((payslip) => (
                    <TableRow key={payslip.id}>
                      <TableCell>{payslip.employeeFirstName} {payslip.employeeLastName}</TableCell>
                      <TableCell>{formatCurrency(payslip.grossPay, payslip.currency)}</TableCell>
                      <TableCell className="font-medium">
                        {formatCurrency(payslip.netPay, payslip.currency)}
                      </TableCell>
                      <TableCell className="text-muted-foreground">{payslip.currency}</TableCell>
                      {showDisbursement && (
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <DisbursementStatusBadge status={payslip.disbursementStatus} />
                            {payslip.disbursementStatus === 'FAILED' && canManage && (
                              <RetryDisbursementButton tenantId={tenantId} payRunId={payRunId} payslipId={payslip.id} />
                            )}
                          </div>
                        </TableCell>
                      )}
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
