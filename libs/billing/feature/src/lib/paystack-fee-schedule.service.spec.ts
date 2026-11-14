import { PaystackFeeScheduleRepository } from '@africahr/billing-data-access';
import { AuditService } from '@africahr/platform-audit';
import { RequestUser } from '@africahr/platform-auth';
import { PaystackFeeScheduleService } from './paystack-fee-schedule.service';

describe('PaystackFeeScheduleService', () => {
  let rates: jest.Mocked<PaystackFeeScheduleRepository>;
  let audit: jest.Mocked<AuditService>;
  let service: PaystackFeeScheduleService;
  const actor = { sub: 'admin-1' } as RequestUser;

  beforeEach(() => {
    rates = { list: jest.fn(), upsert: jest.fn() } as unknown as jest.Mocked<PaystackFeeScheduleRepository>;
    audit = { record: jest.fn().mockResolvedValue(undefined) } as unknown as jest.Mocked<AuditService>;
    service = new PaystackFeeScheduleService(rates, audit);
  });

  it('upserts a rate and audits it platform-wide (no tenantId)', async () => {
    rates.upsert.mockResolvedValue({
      id: 'rate-1',
      currency: 'GHS',
      channel: 'MOBILE_MONEY',
      feeAmount: 1,
      updatedAt: new Date(),
      updatedBy: 'admin-1',
    } as never);

    const result = await service.upsert({ currency: 'GHS', channel: 'MOBILE_MONEY', feeAmount: 1 }, actor);

    expect(rates.upsert).toHaveBeenCalledWith({
      currency: 'GHS',
      channel: 'MOBILE_MONEY',
      feeAmount: 1,
      updatedBy: 'admin-1',
    });
    expect(audit.record).toHaveBeenCalledWith(
      expect.objectContaining({
        tenantId: null,
        actorUserId: 'admin-1',
        action: 'billing.paystack_fee_rate.upserted',
        resourceId: 'rate-1',
      }),
    );
    expect(result).toMatchObject({ id: 'rate-1', currency: 'GHS' });
  });

  it('lists every configured rate', async () => {
    rates.list.mockResolvedValue([]);

    await service.list();

    expect(rates.list).toHaveBeenCalled();
  });
});
