import { Injectable } from '@nestjs/common';
import { PaymentMethodType } from '@prisma/client';
import { PrismaService } from '@africahr/platform-database';

/** Key format shared by both sides of the lookup - see buildPaystackFeeRateKey. */
export function buildPaystackFeeRateKey(currency: string, channel: PaymentMethodType): string {
  return `${currency}:${channel}`;
}

/**
 * Reads the platform-wide schedule of Paystack's own real transfer cost by
 * currency + payment channel (see PaystackTransferFeeRate's schema
 * comment). scope:payroll cannot import billing-data-access's
 * PaystackFeeScheduleRepository (Nx module boundary), so this queries the
 * shared "paystack_transfer_fee_rates" table directly, same
 * cross-bounded-context pattern as PayrollSubscriptionRepository reading
 * "subscriptions". "paystack_transfer_fee_rates" has no tenantId and no RLS
 * policy (it's a platform-wide constant, not tenant data), so this is a
 * plain unscoped query, same posture as PlatformOperatingCostRepository.
 *
 * Fetched once per markPaid()/retryDisbursement() call and kept as an
 * in-memory map rather than queried per payslip - the whole schedule is a
 * handful of rows (one per currency+channel pair ParotHR actually
 * disburses in), far cheaper than a query per payslip.
 */
@Injectable()
export class PayrollPaystackFeeRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findRatesByKey(): Promise<Map<string, number>> {
    const rows = await this.prisma.paystackTransferFeeRate.findMany({
      select: { currency: true, channel: true, feeAmount: true },
    });
    const byKey = new Map<string, number>();
    for (const row of rows) {
      byKey.set(buildPaystackFeeRateKey(row.currency, row.channel), Number(row.feeAmount));
    }
    return byKey;
  }
}
