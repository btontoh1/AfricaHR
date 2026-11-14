import { Prisma } from '@prisma/client';
import { PrismaService } from '@africahr/platform-database';
import { PayrollSubscriptionRepository } from './payroll-subscription.repository';

describe('PayrollSubscriptionRepository', () => {
  let repository: PayrollSubscriptionRepository;
  let tx: { subscription: { findFirst: jest.Mock } };
  let prisma: { withTenantContext: jest.Mock };

  beforeEach(() => {
    tx = { subscription: { findFirst: jest.fn() } };
    prisma = { withTenantContext: jest.fn((_tenantId, fn) => fn(tx)) };
    repository = new PayrollSubscriptionRepository(prisma as unknown as PrismaService);
  });

  describe('findDisbursementFee', () => {
    it('returns the fee as a plain number', async () => {
      tx.subscription.findFirst.mockResolvedValue({
        currency: 'GHS',
        disbursementFeeAmount: new Prisma.Decimal(1),
      });

      const result = await repository.findDisbursementFee('tenant-1');

      expect(result).toEqual({ currency: 'GHS', disbursementFeeAmount: 1 });
    });

    it('defaults to 0 when the subscription has no fee set', async () => {
      tx.subscription.findFirst.mockResolvedValue({ currency: 'GHS', disbursementFeeAmount: null });

      const result = await repository.findDisbursementFee('tenant-1');

      expect(result).toEqual({ currency: 'GHS', disbursementFeeAmount: 0 });
    });

    it('returns null when the tenant has no subscription', async () => {
      tx.subscription.findFirst.mockResolvedValue(null);

      await expect(repository.findDisbursementFee('tenant-1')).resolves.toBeNull();
    });
  });
});
