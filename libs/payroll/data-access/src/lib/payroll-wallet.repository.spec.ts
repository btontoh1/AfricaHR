import { Prisma } from '@prisma/client';
import { PrismaService } from '@africahr/platform-database';
import { InsufficientWalletBalanceError, PayrollWalletRepository } from './payroll-wallet.repository';

describe('PayrollWalletRepository', () => {
  let repository: PayrollWalletRepository;
  let tx: {
    tenantPayrollWallet: { findMany: jest.Mock; findFirst: jest.Mock; updateMany: jest.Mock; upsert: jest.Mock };
  };
  let prisma: { withTenantContext: jest.Mock };

  beforeEach(() => {
    tx = {
      tenantPayrollWallet: {
        findMany: jest.fn(),
        findFirst: jest.fn(),
        updateMany: jest.fn(),
        upsert: jest.fn(),
      },
    };
    prisma = { withTenantContext: jest.fn((_tenantId, fn) => fn(tx)) };
    repository = new PayrollWalletRepository(prisma as unknown as PrismaService);
  });

  describe('getBalances', () => {
    it('returns balances as plain numbers', async () => {
      tx.tenantPayrollWallet.findMany.mockResolvedValue([
        { currency: 'GHS', balance: new Prisma.Decimal(500) },
      ]);

      const result = await repository.getBalances('tenant-1');

      expect(tx.tenantPayrollWallet.findMany).toHaveBeenCalledWith({ where: { tenantId: 'tenant-1' } });
      expect(result).toEqual([{ currency: 'GHS', balance: 500 }]);
    });
  });

  describe('reserveForDisbursement', () => {
    it('does nothing when there are no positive requirements', async () => {
      await repository.reserveForDisbursement('tenant-1', [{ currency: 'GHS', amount: 0 }]);

      expect(prisma.withTenantContext).not.toHaveBeenCalled();
    });

    it('debits every currency when all have sufficient balance', async () => {
      tx.tenantPayrollWallet.updateMany.mockResolvedValue({ count: 1 });

      await repository.reserveForDisbursement('tenant-1', [
        { currency: 'GHS', amount: 1000 },
        { currency: 'USD', amount: 200 },
      ]);

      expect(tx.tenantPayrollWallet.updateMany).toHaveBeenCalledWith({
        where: { tenantId: 'tenant-1', currency: 'GHS', balance: { gte: 1000 } },
        data: { balance: { decrement: 1000 } },
      });
      expect(tx.tenantPayrollWallet.updateMany).toHaveBeenCalledWith({
        where: { tenantId: 'tenant-1', currency: 'USD', balance: { gte: 200 } },
        data: { balance: { decrement: 200 } },
      });
    });

    it('throws InsufficientWalletBalanceError with shortfall details and rolls back nothing further', async () => {
      tx.tenantPayrollWallet.updateMany
        .mockResolvedValueOnce({ count: 1 }) // GHS succeeds
        .mockResolvedValueOnce({ count: 0 }); // USD is short
      tx.tenantPayrollWallet.findFirst.mockResolvedValue({ balance: new Prisma.Decimal(50) });

      await expect(
        repository.reserveForDisbursement('tenant-1', [
          { currency: 'GHS', amount: 1000 },
          { currency: 'USD', amount: 200 },
        ]),
      ).rejects.toThrow(InsufficientWalletBalanceError);
    });

    it('reports 0 available when no wallet row exists for the short currency', async () => {
      tx.tenantPayrollWallet.updateMany.mockResolvedValue({ count: 0 });
      tx.tenantPayrollWallet.findFirst.mockResolvedValue(null);

      let error: InsufficientWalletBalanceError | undefined;
      try {
        await repository.reserveForDisbursement('tenant-1', [{ currency: 'GHS', amount: 1000 }]);
      } catch (caught) {
        error = caught as InsufficientWalletBalanceError;
      }

      expect(error).toBeInstanceOf(InsufficientWalletBalanceError);
      expect(error?.shortfalls).toEqual([{ currency: 'GHS', required: 1000, available: 0 }]);
    });
  });

  describe('refund', () => {
    it('does nothing for a zero or negative amount', async () => {
      await repository.refund('tenant-1', 'GHS', 0);

      expect(prisma.withTenantContext).not.toHaveBeenCalled();
    });

    it('upserts the wallet balance for a positive amount', async () => {
      await repository.refund('tenant-1', 'GHS', 250);

      expect(tx.tenantPayrollWallet.upsert).toHaveBeenCalledWith({
        where: { tenantId_currency: { tenantId: 'tenant-1', currency: 'GHS' } },
        create: { tenantId: 'tenant-1', currency: 'GHS', balance: 250 },
        update: { balance: { increment: 250 } },
      });
    });
  });
});
