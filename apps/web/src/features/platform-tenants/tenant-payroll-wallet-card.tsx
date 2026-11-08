'use client';

import { WalletBalanceCards } from '@/features/payroll-wallet/wallet-balance-cards';
import { WalletTopUpsTable } from '@/features/payroll-wallet/wallet-topups-table';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

/**
 * Read-only - requesting a top-up is deliberately tenant-self-serve (see
 * PAYROLL_WALLET_MANAGE's doc comment in system-role.ts: whoever marks a
 * pay run paid is who needs to keep this funded), so there's no "top up"
 * action here even though PLATFORM_ADMIN holds PAYROLL_WALLET_MANAGE too.
 * This is oversight - confirming a tenant is actually funded before
 * chasing them about a stuck pay run - not a way to fund it for them.
 */
export function TenantPayrollWalletCard({ tenantId }: { tenantId: string }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Payroll Wallet</CardTitle>
        <CardDescription>
          This tenant's prefunded payroll balance - disbursements reserve from it, never directly from Paystack.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <WalletBalanceCards tenantId={tenantId} />
        <WalletTopUpsTable tenantId={tenantId} />
      </CardContent>
    </Card>
  );
}
