import { PrismaService } from '@africahr/platform-database';
import { PaystackFeeScheduleRepository } from './paystack-fee-schedule.repository';

describe('PaystackFeeScheduleRepository', () => {
  let repository: PaystackFeeScheduleRepository;
  let prisma: { paystackTransferFeeRate: { findMany: jest.Mock; upsert: jest.Mock } };

  beforeEach(() => {
    prisma = {
      paystackTransferFeeRate: { findMany: jest.fn(), upsert: jest.fn() },
    };
    repository = new PaystackFeeScheduleRepository(prisma as unknown as PrismaService);
  });

  describe('list', () => {
    it('lists every rate ordered by currency then channel', async () => {
      prisma.paystackTransferFeeRate.findMany.mockResolvedValue([]);

      await repository.list();

      expect(prisma.paystackTransferFeeRate.findMany).toHaveBeenCalledWith({
        orderBy: [{ currency: 'asc' }, { channel: 'asc' }],
      });
    });
  });

  describe('upsert', () => {
    it('creates or updates the rate for a currency/channel pair', async () => {
      await repository.upsert({ currency: 'GHS', channel: 'MOBILE_MONEY', feeAmount: 1, updatedBy: 'admin-1' });

      expect(prisma.paystackTransferFeeRate.upsert).toHaveBeenCalledWith({
        where: { currency_channel: { currency: 'GHS', channel: 'MOBILE_MONEY' } },
        create: { currency: 'GHS', channel: 'MOBILE_MONEY', feeAmount: 1, updatedBy: 'admin-1' },
        update: { feeAmount: 1, updatedBy: 'admin-1' },
      });
    });
  });
});
