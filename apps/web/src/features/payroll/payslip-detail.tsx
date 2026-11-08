'use client';

import { ListPlus, Printer } from 'lucide-react';
import { toast } from 'sonner';
import { usePayslip, useRemovePayslipLineItem } from './queries';
import { AddLineItemForm } from './add-line-item-form';
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
    return <CardSkeleton />;
  }

  if (isError || !payslip) {
    return <ErrorState message={getApiErrorMessage(error, 'Failed to load payslip')} />;
  }

  const canEdit = payslip.status === 'DRAFT';
  const employeeName = `${payslip.employeeFirstName} ${payslip.employeeLastName}`;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Payslip"
        description={employeeName}
        backHref={`/payroll/${payslip.payRunId}`}
        action={
          // The browser's own print dialog offers "Save as PDF", so this one
          // button covers both printing and downloading a PDF copy - no
          // server-side PDF rendering needed.
          <Button variant="outline" onClick={() => window.print()} className="print:hidden">
            <Printer className="size-4" />
            Print / Save as PDF
          </Button>
        }
      />

      <Card>
        <CardContent className="pt-6">
          <div className="text-lg font-semibold">{payslip.organizationName}</div>
          {payslip.organizationAddress && (
            <div className="text-sm text-muted-foreground">{payslip.organizationAddress}</div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Breakdown</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-3">
          <Field label="Employee" value={employeeName} />
          <Field label="Status" value={payslip.status} />
          <Field
            label="Pay period"
            value={`${payslip.periodStart.slice(0, 10)} – ${payslip.periodEnd.slice(0, 10)}`}
          />
          <Field label="Pay date" value={payslip.payDate.slice(0, 10)} />
          <Field label="Country" value={payslip.countryCode} />
          <Field label="Basic salary" value={formatCurrency(payslip.basicSalary, payslip.currency)} />
          <Field label="Gross pay" value={formatCurrency(payslip.grossPay, payslip.currency)} />
          <Field
            label="Taxable income"
            value={formatCurrency(payslip.taxableIncome, payslip.currency)}
          />
          <Field label="PAYE tax" value={formatCurrency(payslip.payeTax, payslip.currency)} />
          <Field
            label="SSNIT (employee)"
            value={formatCurrency(payslip.ssnitEmployee, payslip.currency)}
          />
          <Field
            label="SSNIT (employer)"
            value={formatCurrency(payslip.ssnitEmployer, payslip.currency)}
          />
          {payslip.countryCode === 'GH' && (
            <Field
              label="Tier 2 pension (employer)"
              value={formatCurrency(payslip.ghanaTier2PensionEmployer, payslip.currency)}
            />
          )}
          {payslip.countryCode === 'KE' && (
            <>
              <Field
                label="SHIF (employee)"
                value={formatCurrency(payslip.kenyaShifEmployee, payslip.currency)}
              />
              <Field
                label="Housing Levy (employee)"
                value={formatCurrency(payslip.kenyaHousingLevyEmployee, payslip.currency)}
              />
              <Field
                label="Housing Levy (employer)"
                value={formatCurrency(payslip.kenyaHousingLevyEmployer, payslip.currency)}
              />
            </>
          )}
          {payslip.countryCode === 'NG' && (
            <>
              <Field
                label="NSITF (employer)"
                value={formatCurrency(payslip.nigeriaNsitfEmployer, payslip.currency)}
              />
              <Field
                label="NHIS (employee)"
                value={formatCurrency(payslip.nigeriaNhisEmployee, payslip.currency)}
              />
              <Field
                label="NHIS (employer)"
                value={formatCurrency(payslip.nigeriaNhisEmployer, payslip.currency)}
              />
            </>
          )}
          {Number(payslip.benefitsEmployeeDeduction) > 0 && (
            <Field
              label="Benefits (employee)"
              value={formatCurrency(payslip.benefitsEmployeeDeduction, payslip.currency)}
            />
          )}
          {Number(payslip.benefitsEmployerCost) > 0 && (
            <Field
              label="Benefits (employer)"
              value={formatCurrency(payslip.benefitsEmployerCost, payslip.currency)}
            />
          )}
          {Number(payslip.unpaidLeaveDeduction) > 0 && (
            <Field
              label="Unpaid leave deduction"
              value={formatCurrency(payslip.unpaidLeaveDeduction, payslip.currency)}
            />
          )}
          {Number(payslip.overtimePay) > 0 && (
            <Field
              label="Overtime pay"
              value={formatCurrency(payslip.overtimePay, payslip.currency)}
            />
          )}
          <Field
            label="Total deductions"
            value={formatCurrency(payslip.totalDeductions, payslip.currency)}
          />
          <Field label="Net pay" value={formatCurrency(payslip.netPay, payslip.currency)} />
          <Field label="Currency" value={payslip.currency} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Line items</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
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
                    <TableHead className="print:hidden" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {payslip.lineItems.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell>{item.type}</TableCell>
                      <TableCell>{item.code}</TableCell>
                      <TableCell className="text-muted-foreground">{item.description ?? '—'}</TableCell>
                      <TableCell>{formatCurrency(item.amount, payslip.currency)}</TableCell>
                      <TableCell className="print:hidden">
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
            </TableCard>
          )}
          {canEdit && (
            <div className="print:hidden">
              <AddLineItemForm tenantId={tenantId} payslipId={payslipId} />
            </div>
          )}
          {!canEdit && (
            <p className="text-xs text-muted-foreground print:hidden">
              Line items can only be changed while the payslip is in DRAFT.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
