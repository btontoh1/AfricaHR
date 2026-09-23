'use client';

import { Layers } from 'lucide-react';
import { useAccounts } from './queries';
import { getApiErrorMessage } from '@/lib/api-error';
import { TableCard } from '@/components/table-card';
import { EmptyState } from '@/components/empty-state';
import { TableSkeleton } from '@/components/loading-state';
import { ErrorState } from '@/components/error-state';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import type { VariantProps } from 'class-variance-authority';
import type { badgeVariants } from '@/components/ui/badge';

type BadgeVariant = VariantProps<typeof badgeVariants>['variant'];

const TYPE_BADGE_VARIANT: Record<string, BadgeVariant> = {
  ASSET: 'secondary',
  LIABILITY: 'warning',
  EQUITY: 'default',
  REVENUE: 'success',
  EXPENSE: 'outline',
};

const TYPE_LABELS: Record<string, string> = {
  ASSET: 'Asset',
  LIABILITY: 'Liability',
  EQUITY: 'Equity',
  REVENUE: 'Revenue',
  EXPENSE: 'Expense',
};

export function ChartOfAccountsList({ tenantId }: { tenantId: string }) {
  const { data: accounts, isLoading, isError, error } = useAccounts(tenantId);

  if (isLoading) {
    return <TableSkeleton />;
  }

  if (isError) {
    return <ErrorState message={getApiErrorMessage(error, 'Failed to load the chart of accounts')} />;
  }

  if (!accounts || accounts.length === 0) {
    return <EmptyState icon={Layers} title="No accounts yet" />;
  }

  return (
    <TableCard>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Code</TableHead>
            <TableHead>Name</TableHead>
            <TableHead>Type</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {accounts.map((account) => (
            <TableRow key={account.id}>
              <TableCell className="font-mono text-muted-foreground">{account.code}</TableCell>
              <TableCell className="font-medium">{account.name}</TableCell>
              <TableCell>
                <Badge variant={TYPE_BADGE_VARIANT[account.type] ?? 'outline'}>
                  {TYPE_LABELS[account.type] ?? account.type}
                </Badge>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableCard>
  );
}
