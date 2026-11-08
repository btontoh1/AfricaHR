'use client';

import { useState } from 'react';
import { ReceiptText } from 'lucide-react';
import { useExpenses } from './queries';
import { ReimburseExpenseDialog } from './reimburse-expense-dialog';
import { OrganizationFilter, ALL_ORGANIZATIONS } from '@/features/reporting/organization-filter';
import { getApiErrorMessage } from '@/lib/api-error';
import { formatCurrency } from '@/lib/format-currency';
import { TableCard } from '@/components/table-card';
import { EmptyState } from '@/components/empty-state';
import { TableSkeleton } from '@/components/loading-state';
import { ErrorState } from '@/components/error-state';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

const CATEGORY_LABEL: Record<string, string> = {
  OFFICE_SUPPLIES: 'Office supplies',
  TRAVEL: 'Travel',
  UTILITIES: 'Utilities',
  MEALS_AND_ENTERTAINMENT: 'Meals & entertainment',
  PROFESSIONAL_SERVICES: 'Professional services',
  RENT: 'Rent',
  OTHER: 'Other',
};

export function ExpensesList({ tenantId }: { tenantId: string }) {
  const [organizationId, setOrganizationId] = useState(ALL_ORGANIZATIONS);
  const scopedOrganizationId = organizationId === ALL_ORGANIZATIONS ? undefined : organizationId;
  const { data: expenses, isLoading, isError, error } = useExpenses(tenantId, scopedOrganizationId);

  return (
    <div className="space-y-4">
      <OrganizationFilter tenantId={tenantId} value={organizationId} onChange={setOrganizationId} />

      {isLoading && <TableSkeleton />}

      {isError && <ErrorState message={getApiErrorMessage(error, 'Failed to load expenses')} />}

      {expenses && expenses.length === 0 && (
        <EmptyState icon={ReceiptText} title="No expenses yet" description="Add one above to get started." />
      )}

      {expenses && expenses.length > 0 && (
        <TableCard>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Category</TableHead>
                <TableHead className="text-right">Amount</TableHead>
                <TableHead>Paid by</TableHead>
                <TableHead>Status</TableHead>
                <TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              {expenses.map((expense) => (
                <TableRow key={expense.id}>
                  <TableCell className="text-muted-foreground">{expense.expenseDate.slice(0, 10)}</TableCell>
                  <TableCell className="font-medium">{expense.description}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {CATEGORY_LABEL[expense.category] ?? expense.category}
                  </TableCell>
                  <TableCell className="text-right">{formatCurrency(expense.amount, expense.currency)}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{expense.paidBy === 'COMPANY' ? 'Company' : 'Employee'}</Badge>
                  </TableCell>
                  <TableCell>
                    {expense.paidBy === 'COMPANY' ? (
                      <Badge variant="success">Paid</Badge>
                    ) : expense.reimbursedAt ? (
                      <Badge variant="success">Reimbursed</Badge>
                    ) : (
                      <Badge variant="warning">Awaiting reimbursement</Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    {expense.paidBy === 'EMPLOYEE' && !expense.reimbursedAt && (
                      <ReimburseExpenseDialog tenantId={tenantId} expenseId={expense.id} description={expense.description} />
                    )}
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
