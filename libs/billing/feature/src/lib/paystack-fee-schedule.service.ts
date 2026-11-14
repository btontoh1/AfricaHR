import { Injectable } from '@nestjs/common';
import { PaystackTransferFeeRate } from '@prisma/client';
import { RequestUser } from '@africahr/platform-auth';
import { AuditService } from '@africahr/platform-audit';
import { buildEmployeeCountByChannelKey, PaystackFeeScheduleRepository } from '@africahr/billing-data-access';
import { UpsertPaystackFeeRateDto } from './dto/upsert-paystack-fee-rate.dto';

export type PaystackFeeRateWithUsage = PaystackTransferFeeRate & { employeeCount: number };

/**
 * Platform-wide schedule of Paystack's own real transfer cost by currency +
 * channel - see PaystackTransferFeeRate's schema comment for why this
 * exists and isn't per-tenant. Not tied to any one tenantId, so audit
 * entries here are recorded with tenantId: null, same posture as other
 * platform-wide settings (e.g. PlatformOperatingCostService).
 */
@Injectable()
export class PaystackFeeScheduleService {
  constructor(
    private readonly rates: PaystackFeeScheduleRepository,
    private readonly audit: AuditService,
  ) {}

  /** Each rate annotated with how many active employees, platform-wide, that currency+channel actually reaches - lets the admin page show a per-run total, not just the per-transfer rate. */
  async list(): Promise<PaystackFeeRateWithUsage[]> {
    const [rates, counts] = await Promise.all([
      this.rates.list(),
      this.rates.countEmployeesByCurrencyAndChannel(),
    ]);
    return rates.map((rate) => ({
      ...rate,
      employeeCount: counts.get(buildEmployeeCountByChannelKey(rate.currency, rate.channel)) ?? 0,
    }));
  }

  async upsert(dto: UpsertPaystackFeeRateDto, actor: RequestUser): Promise<PaystackTransferFeeRate> {
    const rate = await this.rates.upsert({
      currency: dto.currency,
      channel: dto.channel,
      feeAmount: dto.feeAmount,
      updatedBy: actor.sub,
    });

    await this.audit.record({
      tenantId: null,
      actorUserId: actor.sub,
      action: 'billing.paystack_fee_rate.upserted',
      resourceType: 'PaystackTransferFeeRate',
      resourceId: rate.id,
      metadata: { currency: dto.currency, channel: dto.channel, feeAmount: dto.feeAmount },
    });

    return rate;
  }
}
