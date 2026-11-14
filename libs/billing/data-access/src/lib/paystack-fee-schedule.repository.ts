import { Injectable } from '@nestjs/common';
import { PaymentMethodType, PaystackTransferFeeRate } from '@prisma/client';
import { PrismaService } from '@africahr/platform-database';

export interface UpsertPaystackFeeRateInput {
  currency: string;
  channel: PaymentMethodType;
  feeAmount: number;
  updatedBy?: string;
}

interface RawEmployeeCountByChannelRow {
  currency: string;
  channel: PaymentMethodType;
  employeeCount: string;
}

/** Keys buildEmployeeCountByChannelKey produces - shared between countEmployeesByCurrencyAndChannel and its caller so the two never drift apart. */
export function buildEmployeeCountByChannelKey(currency: string, channel: PaymentMethodType): string {
  return `${currency}:${channel}`;
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

  /**
   * How many active employees, across every tenant, would be charged each
   * currency+channel's real transfer cost - lets the Paystack Fees admin
   * page show the platform-wide total alongside the per-transfer rate.
   * "employees" and "employee_payment_methods" both use the plain
   * tenant_isolation RLS policy (no platform-sentinel branch), so this
   * goes through a SECURITY DEFINER SQL function instead of a plain
   * query - see platform_employee_counts_by_currency_and_channel's own
   * migration comment.
   */
  async countEmployeesByCurrencyAndChannel(): Promise<Map<string, number>> {
    const rows = await this.prisma.$queryRaw<
      RawEmployeeCountByChannelRow[]
    >`SELECT * FROM platform_employee_counts_by_currency_and_channel()`;
    return new Map(
      rows.map((row) => [buildEmployeeCountByChannelKey(row.currency, row.channel), Number(row.employeeCount)]),
    );
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
