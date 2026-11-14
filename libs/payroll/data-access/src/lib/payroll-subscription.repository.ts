import { Injectable } from '@nestjs/common';
import { PrismaService } from '@africahr/platform-database';

export interface PayrollSubscriptionFee {
  currency: string;
  disbursementFeeAmount: number;
}

/**
 * Reads only the one Subscription field payroll disbursement needs - the
 * platform fee ParotHR charges per transaction (see Subscription.
 * disbursementFeeAmount's schema comment). scope:payroll cannot import
 * billing-data-access's SubscriptionRepository (Nx module boundary), so
 * this queries the shared "subscriptions" table directly, same
 * cross-bounded-context pattern as PayrollWalletRepository reading
 * "tenant_payroll_wallets".
 */
@Injectable()
export class PayrollSubscriptionRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findDisbursementFee(tenantId: string): Promise<PayrollSubscriptionFee | null> {
    const subscription = await this.prisma.withTenantContext(tenantId, (tx) =>
      tx.subscription.findFirst({
        where: { tenantId },
        select: { currency: true, disbursementFeeAmount: true },
      }),
    );
    if (!subscription) {
      return null;
    }
    return {
      currency: subscription.currency,
      disbursementFeeAmount: Number(subscription.disbursementFeeAmount ?? 0),
    };
  }
}
