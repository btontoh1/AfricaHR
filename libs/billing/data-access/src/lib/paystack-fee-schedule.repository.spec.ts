import { PrismaService } from '@africahr/platform-database';
import { buildEmployeeCountByChannelKey, PaystackFeeScheduleRepository } from './paystack-fee-schedule.repository';

describe('PaystackFeeScheduleRepository', () => {
  let repository: PaystackFeeScheduleRepository;
  let prisma: { paystackTransferFeeRate: { findMany: jest.Mock; upsert: jest.Mock }; $queryRaw: jest.Mock };

  beforeEach(() => {
    prisma = {
      paystackTransferFeeRate: { findMany: jest.fn(), upsert: jest.fn() },
      $queryRaw: jest.fn(),
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

  describe('countEmployeesByCurrencyAndChannel', () => {
    it('keys each count by currency and channel', async () => {
      prisma.$queryRaw.mockResolvedValue([
        { currency: 'GHS', channel: 'MOBILE_MONEY', employeeCount: '312' },
        { currency: 'GHS', channel: 'BANK_ACCOUNT', employeeCount: '4' },
      ]);

      const result = await repository.countEmployeesByCurrencyAndChannel();

      expect(prisma.$queryRaw).toHaveBeenCalled();
      expect(result).toEqual(
        new Map([
          [buildEmployeeCountByChannelKey('GHS', 'MOBILE_MONEY'), 312],
          [buildEmployeeCountByChannelKey('GHS', 'BANK_ACCOUNT'), 4],
        ]),
      );
    });

    it('returns an empty map when no employee has a payment method yet', async () => {
      prisma.$queryRaw.mockResolvedValue([]);

      const result = await repository.countEmployeesByCurrencyAndChannel();

      expect(result.size).toBe(0);
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
