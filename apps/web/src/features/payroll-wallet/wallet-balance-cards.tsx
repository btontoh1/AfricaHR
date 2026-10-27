'use client';

import { Wallet } from 'lucide-react';
import { useWalletBalances } from './queries';
import { getApiErrorMessage } from '@/lib/api-error';
import { formatCurrency } from '@/lib/format-currency';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CardSkeleton } from '@/components/loading-state';
import { ErrorState } from '@/components/error-state';
import { EmptyState } from '@/components/empty-state';

export function WalletBalanceCards({ tenantId }: { tenantId: string }) {
  const { data: balances, isLoading, isError, error } = useWalletBalances(tenantId);

  if (isLoading) {
    return <CardSkeleton />;
  }

  if (isError) {
    return <ErrorState message={getApiErrorMessage(error, 'Failed to load wallet balances')} />;
  }

  if (!balances || balances.length === 0) {
    return (
      <Card>
        <CardContent>
          <EmptyState
            icon={Wallet}
            title="No wallet balance yet"
            description="Top up the payroll wallet before marking a pay run paid - disbursements draw from this balance, not directly from Paystack."
          />
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-3">
      {balances.map((balance) => (
        <Card key={balance.currency}>
          <CardHeader>
            <CardTitle className="text-sm text-muted-foreground">{balance.currency} balance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold">{formatCurrency(balance.balance, balance.currency)}</div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
