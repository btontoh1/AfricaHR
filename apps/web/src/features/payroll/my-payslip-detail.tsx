'use client';

import { useMyPayslip } from './queries';
import { PayslipStatusBadge } from './payslip-status-badge';
import { getApiErrorMessage } from '@/lib/api-error';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CardSkeleton } from '@/components/loading-state';
import { ErrorState } from '@/components/error-state';
import { EmptyState } from '@/components/empty-state';
import { ListPlus } from 'lucide-react';
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

export function MyPayslipDetail({ tenantId, payslipId }: { tenantId: string; payslipId: string }) {
  const { data: payslip, isLoading, isError, error } = useMyPayslip(tenantId, payslipId);

  if (isLoading) {
    return <CardSkeleton />;
  }

  if (isError || !payslip) {
    return <ErrorState message={getApiErrorMessage(error, 'Failed to load payslip')} />;
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Breakdown</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-3">
          <Field label="Status" value={<PayslipStatusBadge status={payslip.status} />} />
          <Field label="Country" value={payslip.countryCode} />
          <Field label="Basic salary" value={payslip.basicSalary} />
          <Field label="Gross pay" value={payslip.grossPay} />
          <Field label="Taxable income" value={payslip.taxableIncome} />
          <Field label="PAYE tax" value={payslip.payeTax} />
          <Field label="SSNIT (employee)" value={payslip.ssnitEmployee} />
          <Field label="SSNIT (employer)" value={payslip.ssnitEmployer} />
          <Field label="Total deductions" value={payslip.totalDeductions} />
          <Field label="Net pay" value={payslip.netPay} />
          <Field label="Currency" value={payslip.currency} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Line items</CardTitle>
        </CardHeader>
        <CardContent>
          {payslip.lineItems.length === 0 && (
            <EmptyState icon={ListPlus} title="No ad-hoc line items" />
          )}
          {payslip.lineItems.length > 0 && (
            <TableCard>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Type</TableHead>
                    <TableHead>Code</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Amount</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {payslip.lineItems.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell>{item.type}</TableCell>
                      <TableCell>{item.code}</TableCell>
                      <TableCell className="text-muted-foreground">{item.description ?? '—'}</TableCell>
                      <TableCell>{item.amount}</TableCell>
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
