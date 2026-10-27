'use client';

import { WalletBalanceCards } from './wallet-balance-cards';
import { WalletTopUpsTable } from './wallet-topups-table';
import { RequestTopUpDialog } from './request-topup-dialog';
import { useMyTenant } from '@/features/settings/queries';
import { PageHeader } from '@/components/page-header';
import { Button } from '@/components/ui/button';

export function PayrollWalletView({ tenantId }: { tenantId: string }) {
  // The top-up dialog needs this to fix the currency field - the backend
  // rejects any top-up currency other than the tenant's own
  // (TenantPayrollWalletService.requestTopUp), so there's no point letting
  // the dialog render until it's known.
  const { data: tenant } = useMyTenant();

  return (
    <div>
      <PageHeader
        title="Payroll wallet"
        description="Prefund payroll here before marking a pay run paid - disbursements reserve from this balance, never directly from Paystack."
        action={
          tenant ? (
            <RequestTopUpDialog tenantId={tenantId} tenantCurrency={tenant.currency} />
          ) : (
            <Button size="sm" disabled>
              Top up wallet
            </Button>
          )
        }
      />

      <div className="space-y-6">
        <WalletBalanceCards tenantId={tenantId} />
        <WalletTopUpsTable tenantId={tenantId} />
      </div>
    </div>
  );
}
