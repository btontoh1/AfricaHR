import { Injectable } from '@nestjs/common';
import { PaymentMethodType, PaystackTransferFeeRate } from '@prisma/client';
import { PrismaService } from '@africahr/platform-database';

export interface UpsertPaystackFeeRateInput {
  currency: string;
  channel: PaymentMethodType;
  feeAmount: number;
  updatedBy?: string;
}

/**
 * Platform-wide (no tenantId) - see PaystackTransferFeeRate's own schema
 * comment. Not RLS-scoped, same as PlatformOperatingCostRepository/
 * PlatformFinancialInputRepository.
 */
@Injectable()
export class PaystackFeeScheduleRepository {
  constructor(private readonly prisma: PrismaService) {}

  list(): Promise<PaystackTransferFeeRate[]> {
    return this.prisma.paystackTransferFeeRate.findMany({
      orderBy: [{ currency: 'asc' }, { channel: 'asc' }],
    });
  }

  upsert(input: UpsertPaystackFeeRateInput): Promise<PaystackTransferFeeRate> {
    return this.prisma.paystackTransferFeeRate.upsert({
      where: { currency_channel: { currency: input.currency, channel: input.channel } },
      create: {
        currency: input.currency,
        channel: input.channel,
        feeAmount: input.feeAmount,
        updatedBy: input.updatedBy,
      },
      update: {
        feeAmount: input.feeAmount,
        updatedBy: input.updatedBy,
      },
    });
  }
}
