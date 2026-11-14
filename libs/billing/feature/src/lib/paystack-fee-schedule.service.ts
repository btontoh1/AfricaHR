import { Injectable } from '@nestjs/common';
import { PaystackTransferFeeRate } from '@prisma/client';
import { RequestUser } from '@africahr/platform-auth';
import { AuditService } from '@africahr/platform-audit';
import { PaystackFeeScheduleRepository } from '@africahr/billing-data-access';
import { UpsertPaystackFeeRateDto } from './dto/upsert-paystack-fee-rate.dto';

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

  list(): Promise<PaystackTransferFeeRate[]> {
    return this.rates.list();
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
