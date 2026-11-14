import { Prisma } from '@prisma/client';
import { PrismaService } from '@africahr/platform-database';
import { buildPaystackFeeRateKey, PayrollPaystackFeeRepository } from './payroll-paystack-fee.repository';

describe('PayrollPaystackFeeRepository', () => {
  let repository: PayrollPaystackFeeRepository;
  let prisma: { paystackTransferFeeRate: { findMany: jest.Mock } };

  beforeEach(() => {
    prisma = { paystackTransferFeeRate: { findMany: jest.fn() } };
    repository = new PayrollPaystackFeeRepository(prisma as unknown as PrismaService);
  });

  describe('findRatesByKey', () => {
    it('keys each rate by currency and channel', async () => {
      prisma.paystackTransferFeeRate.findMany.mockResolvedValue([
        { currency: 'GHS', channel: 'MOBILE_MONEY', feeAmount: new Prisma.Decimal(1) },
        { currency: 'GHS', channel: 'BANK_ACCOUNT', feeAmount: new Prisma.Decimal(8) },
      ]);

      const result = await repository.findRatesByKey();

      expect(result.get(buildPaystackFeeRateKey('GHS', 'MOBILE_MONEY'))).toBe(1);
      expect(result.get(buildPaystackFeeRateKey('GHS', 'BANK_ACCOUNT'))).toBe(8);
    });

    it('returns an empty map when no rates are configured', async () => {
      prisma.paystackTransferFeeRate.findMany.mockResolvedValue([]);

      const result = await repository.findRatesByKey();

      expect(result.size).toBe(0);
    });
  });
});
