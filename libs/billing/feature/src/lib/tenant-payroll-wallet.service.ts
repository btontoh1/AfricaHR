import { randomUUID } from 'node:crypto';
import { Injectable } from '@nestjs/common';
import { TenantPayrollWallet, TenantWalletTopUp } from '@prisma/client';
import { AuditService } from '@africahr/platform-audit';
import {
  BillingTenantContactRepository,
  PlatformBillingRepository,
  TenantPayrollWalletRepository,
} from '@africahr/billing-data-access';
import { PaystackClient } from './paystack-client';

/**
 * Funds a tenant's payroll wallet (see TenantPayrollWallet's own doc
 * comment for why a top-up must be a real Paystack transaction, not a
 * side-channel bank transfer). Deliberately tenant-self-serve, unlike
 * InvoiceController's PLATFORM_BILLING_MANAGE-only v1 posture: a tenant
 * admin/payroll manager is the one who knows how much payroll they're
 * about to run and when, so gating this on a platform admin acting on
 * their behalf would defeat the point - see TenantPayrollWalletController.
 */
@Injectable()
export class TenantPayrollWalletService {
  constructor(
    private readonly wallets: TenantPayrollWalletRepository,
    private readonly tenantContacts: BillingTenantContactRepository,
    private readonly platformBilling: PlatformBillingRepository,
    private readonly paystack: PaystackClient,
    private readonly audit: AuditService,
  ) {}

  listBalances(tenantId: string): Promise<TenantPayrollWallet[]> {
    return this.wallets.listBalances(tenantId);
  }

  listTopUps(tenantId: string): Promise<TenantWalletTopUp[]> {
    return this.wallets.listTopUpsForTenant(tenantId);
  }

  async requestTopUp(
    tenantId: string,
    currency: string,
    amount: number,
    actorId?: string,
  ): Promise<TenantWalletTopUp> {
    const adminEmail = await this.tenantContacts.findAdminEmail(tenantId);
    const email = adminEmail ?? `tenant-${tenantId}@parothr.local`;

    const reference = randomUUID();
    const checkout = await this.paystack.initializeTransaction({
      email,
      amount,
      currency,
      reference,
      metadata: { tenantId, purpose: 'payroll_wallet_topup' },
    });

    const topUp = await this.wallets.createTopUp({
      tenantId,
      currency,
      amount,
      paystackReference: checkout.reference,
      checkoutUrl: checkout.authorizationUrl,
      createdBy: actorId,
    });

    await this.audit.record({
      tenantId,
      actorUserId: actorId ?? null,
      action: 'billing.wallet.topup_requested',
      resourceType: 'TenantWalletTopUp',
      resourceId: topUp.id,
      metadata: { currency, amount },
    });

    return topUp;
  }

  /**
   * Called from InvoiceService.handlePaystackWebhook as the fallback when a
   * charge.success reference doesn't match any Invoice - see that method's
   * doc comment. Silently no-ops on an unknown or already-paid reference,
   * same posture as the invoice path, since a duplicate webhook delivery
   * isn't a failure.
   */
  async creditTopUpByReference(reference: string): Promise<void> {
    const topUp = await this.platformBilling.findWalletTopUpByPaystackReference(reference);
    if (!topUp || topUp.status === 'PAID') {
      return;
    }

    await this.wallets.creditBalance(topUp.tenantId, topUp.currency, topUp.amount);
    await this.wallets.updateTopUp(topUp.tenantId, topUp.id, { status: 'PAID', paidAt: new Date() });

    await this.audit.record({
      tenantId: topUp.tenantId,
      actorUserId: null,
      action: 'billing.wallet.topped_up',
      resourceType: 'TenantWalletTopUp',
      resourceId: topUp.id,
      metadata: { currency: topUp.currency, amount: topUp.amount },
    });
  }
}
