'use client';

import { useWalletBalances } from './queries';
import { WalletBalanceCards } from './wallet-balance-cards';
import { WalletTopUpsTable } from './wallet-topups-table';
import { RequestTopUpDialog } from './request-topup-dialog';
import { PageHeader } from '@/components/page-header';

export function PayrollWalletView({ tenantId }: { tenantId: string }) {
  // Only used to default the top-up dialog's currency field to a currency
  // the tenant already holds a balance in, if any - not a loading gate for
  // the page itself (WalletBalanceCards handles its own loading state).
  const { data: balances } = useWalletBalances(tenantId);

  return (
    <div>
      <PageHeader
        title="Payroll wallet"
        description="Prefund payroll here before marking a pay run paid - disbursements reserve from this balance, never directly from Paystack."
        action={<RequestTopUpDialog tenantId={tenantId} defaultCurrency={balances?.[0]?.currency} />}
      />

      <div className="space-y-6">
        <WalletBalanceCards tenantId={tenantId} />
        <WalletTopUpsTable tenantId={tenantId} />
      </div>
    </div>
  );
}
