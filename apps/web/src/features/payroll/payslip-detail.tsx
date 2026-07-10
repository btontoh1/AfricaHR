'use client';

import { toast } from 'sonner';
import { usePayslip, useRemovePayslipLineItem } from './queries';
import { AddLineItemForm } from './add-line-item-form';
import { getApiErrorMessage } from '@/lib/api-error';
import { Button } from '@/components/ui/button';
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

export function PayslipDetail({ tenantId, payslipId }: { tenantId: string; payslipId: string }) {
  const { data: payslip, isLoading, isError, error } = usePayslip(tenantId, payslipId);
  const removeLineItem = useRemovePayslipLineItem(tenantId, payslipId);

  async function handleRemove(lineItemId: string) {
    try {
      await removeLineItem.mutateAsync(lineItemId);
      toast.success('Line item removed');
    } catch (removeError) {
      toast.error(getApiErrorMessage(removeError, 'Failed to remove line item'));
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-2">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-32 w-full" />
      </div>
    );
  }

  if (isError || !payslip) {
    return (
      <p className="text-sm text-destructive">{getApiErrorMessage(error, 'Failed to load payslip')}</p>
    );
  }

  const canEdit = payslip.status === 'DRAFT';

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Payslip</h1>

      <Card>
        <CardHeader>
          <CardTitle>Breakdown</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-3">
          <Field label="Employee" value={payslip.employeeId} />
          <Field label="Status" value={payslip.status} />
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
        <CardContent className="space-y-4">
          {payslip.lineItems.length === 0 && (
            <p className="text-sm text-muted-foreground">No ad-hoc line items.</p>
          )}
          {payslip.lineItems.length > 0 && (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Type</TableHead>
                  <TableHead>Code</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead />
                </TableRow>
              </TableHeader>
              <TableBody>
                {payslip.lineItems.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell>{item.type}</TableCell>
                    <TableCell>{item.code}</TableCell>
                    <TableCell>{item.description ?? '—'}</TableCell>
                    <TableCell>{item.amount}</TableCell>
                    <TableCell>
                      {canEdit && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleRemove(item.id)}
                          disabled={removeLineItem.isPending}
                        >
                          Remove
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
          {canEdit && <AddLineItemForm tenantId={tenantId} payslipId={payslipId} />}
          {!canEdit && (
            <p className="text-xs text-muted-foreground">
              Line items can only be changed while the payslip is in DRAFT.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
