'use client';

import { useState } from 'react';
import { Wallet } from 'lucide-react';
import { useBudgets } from './queries';
import { SetBudgetDialog } from './set-budget-dialog';
import { DeleteBudgetDialog } from './delete-budget-dialog';
import { OrganizationFilter, ALL_ORGANIZATIONS } from '@/features/reporting/organization-filter';
import { getApiErrorMessage } from '@/lib/api-error';
import { formatCurrency } from '@/lib/format-currency';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { TableCard } from '@/components/table-card';
import { EmptyState } from '@/components/empty-state';
import { TableSkeleton } from '@/components/loading-state';
import { ErrorState } from '@/components/error-state';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

function currentYear(): number {
  return new Date().getFullYear();
}

export function BudgetsView({ tenantId }: { tenantId: string }) {
  const [organizationId, setOrganizationId] = useState(ALL_ORGANIZATIONS);
  const [fiscalYear, setFiscalYear] = useState(currentYear());

  const scopedOrganizationId = organizationId === ALL_ORGANIZATIONS ? undefined : organizationId;
  const { data: budgets, isLoading, isError, error } = useBudgets(tenantId, {
    organizationId: scopedOrganizationId,
    fiscalYear,
  });

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="flex flex-wrap items-end gap-3">
          <OrganizationFilter tenantId={tenantId} value={organizationId} onChange={setOrganizationId} />
          <div>
            <Label htmlFor="budgets-fiscal-year">Fiscal year</Label>
            <Input
              id="budgets-fiscal-year"
              type="number"
              className="w-28"
              min={2000}
              max={2100}
              value={fiscalYear}
              onChange={(e) => setFiscalYear(Number(e.target.value) || currentYear())}
            />
          </div>
        </div>
        <SetBudgetDialog
          tenantId={tenantId}
          defaultOrganizationId={scopedOrganizationId}
          defaultFiscalYear={fiscalYear}
        />
      </div>

      {isLoading && <TableSkeleton />}

      {isError && <ErrorState message={getApiErrorMessage(error, 'Failed to load budgets')} />}

      {budgets && budgets.length === 0 && (
        <EmptyState icon={Wallet} title="No budgets set for this year" description="Set your first budget above." />
      )}

      {budgets && budgets.length > 0 && (
        <TableCard>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Account</TableHead>
                <TableHead>Currency</TableHead>
                <TableHead className="text-right">Budgeted amount</TableHead>
                <TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              {budgets.map((budget) => (
                <TableRow key={budget.id}>
                  <TableCell>
                    <span className="font-mono text-muted-foreground">{budget.accountCode}</span>{' '}
                    {budget.accountName}
                  </TableCell>
                  <TableCell className="text-muted-foreground">{budget.currency}</TableCell>
                  <TableCell className="text-right">{formatCurrency(budget.amount, budget.currency)}</TableCell>
                  <TableCell className="text-right">
                    <DeleteBudgetDialog tenantId={tenantId} budgetId={budget.id} accountName={budget.accountName} />
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
