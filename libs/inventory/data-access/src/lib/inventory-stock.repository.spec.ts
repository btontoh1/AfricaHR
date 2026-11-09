import { ConflictException, NotFoundException } from '@nestjs/common';
import { Prisma, InventoryStockTransactionType } from '@prisma/client';
import { PrismaService } from '@africahr/platform-database';
import { InsufficientStockError, InventoryStockRepository } from './inventory-stock.repository';

function knownRequestError(code: string): Prisma.PrismaClientKnownRequestError {
  return Object.assign(Object.create(Prisma.PrismaClientKnownRequestError.prototype), {
    code,
    message: 'mock',
  });
}

describe('InventoryStockRepository', () => {
  let repository: InventoryStockRepository;
  let tx: {
    inventoryStockBalance: { updateMany: jest.Mock; upsert: jest.Mock; findUnique: jest.Mock; findMany: jest.Mock };
    inventoryStockLedgerEntry: { create: jest.Mock; findFirst: jest.Mock; findMany: jest.Mock };
  };
  let prisma: { withTenantContext: jest.Mock };

  beforeEach(() => {
    tx = {
      inventoryStockBalance: { updateMany: jest.fn(), upsert: jest.fn(), findUnique: jest.fn(), findMany: jest.fn() },
      inventoryStockLedgerEntry: { create: jest.fn(), findFirst: jest.fn(), findMany: jest.fn() },
    };
    prisma = { withTenantContext: jest.fn((_tenantId, fn) => fn(tx)) };
    repository = new InventoryStockRepository(prisma as unknown as PrismaService);
  });

  describe('postEntry', () => {
    it('credits the balance and posts a GOODS_RECEIVED entry', async () => {
      tx.inventoryStockLedgerEntry.create.mockResolvedValue({ id: 'entry-1' });

      await repository.postEntry('tenant-1', {
        warehouseId: 'wh-1',
        productId: 'prod-1',
        transactionType: InventoryStockTransactionType.GOODS_RECEIVED,
        quantityIn: 100,
        unitCost: 2.5,
      });

      expect(tx.inventoryStockBalance.upsert).toHaveBeenCalledWith({
        where: { tenantId_warehouseId_productId: { tenantId: 'tenant-1', warehouseId: 'wh-1', productId: 'prod-1' } },
        create: { tenantId: 'tenant-1', warehouseId: 'wh-1', productId: 'prod-1', quantity: 100 },
        update: { quantity: { increment: 100 } },
      });
      expect(tx.inventoryStockLedgerEntry.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          tenantId: 'tenant-1',
          warehouseId: 'wh-1',
          productId: 'prod-1',
          transactionType: 'GOODS_RECEIVED',
          quantityIn: 100,
          quantityOut: 0,
          unitCost: 2.5,
        }),
      });
    });

    it('debits the balance via a conditional updateMany and posts a GOODS_ISSUED entry when enough stock is on hand', async () => {
      tx.inventoryStockBalance.updateMany.mockResolvedValue({ count: 1 });
      tx.inventoryStockLedgerEntry.create.mockResolvedValue({ id: 'entry-2' });

      await repository.postEntry('tenant-1', {
        warehouseId: 'wh-1',
        productId: 'prod-1',
        transactionType: InventoryStockTransactionType.GOODS_ISSUED,
        quantityOut: 30,
      });

      expect(tx.inventoryStockBalance.updateMany).toHaveBeenCalledWith({
        where: { tenantId: 'tenant-1', warehouseId: 'wh-1', productId: 'prod-1', quantity: { gte: 30 } },
        data: { quantity: { increment: -30 } },
      });
      expect(tx.inventoryStockLedgerEntry.create).toHaveBeenCalled();
    });

    it('rejects an issue that would take the balance negative, without posting a ledger entry', async () => {
      tx.inventoryStockBalance.updateMany.mockResolvedValue({ count: 0 });
      tx.inventoryStockBalance.findUnique.mockResolvedValue({ quantity: 10 });

      await expect(
        repository.postEntry('tenant-1', {
          warehouseId: 'wh-1',
          productId: 'prod-1',
          transactionType: InventoryStockTransactionType.GOODS_ISSUED,
          quantityOut: 30,
        }),
      ).rejects.toThrow(InsufficientStockError);

      expect(tx.inventoryStockLedgerEntry.create).not.toHaveBeenCalled();
    });

    it('reports zero available stock when no balance row exists at all', async () => {
      tx.inventoryStockBalance.updateMany.mockResolvedValue({ count: 0 });
      tx.inventoryStockBalance.findUnique.mockResolvedValue(null);

      await expect(
        repository.postEntry('tenant-1', {
          warehouseId: 'wh-1',
          productId: 'prod-1',
          transactionType: InventoryStockTransactionType.GOODS_ISSUED,
          quantityOut: 5,
        }),
      ).rejects.toMatchObject({ available: 0, requested: 5 });
    });
  });

  describe('postEntries', () => {
    it('posts a transfer as two linked entries in one transaction', async () => {
      tx.inventoryStockBalance.updateMany.mockResolvedValue({ count: 1 });
      tx.inventoryStockLedgerEntry.create
        .mockResolvedValueOnce({ id: 'out-1' })
        .mockResolvedValueOnce({ id: 'in-1' });

      const entries = await repository.postEntries('tenant-1', [
        {
          warehouseId: 'wh-1',
          productId: 'prod-1',
          transactionType: InventoryStockTransactionType.TRANSFER_OUT,
          quantityOut: 10,
          referenceType: 'StockTransfer',
          referenceId: 'transfer-1',
        },
        {
          warehouseId: 'wh-2',
          productId: 'prod-1',
          transactionType: InventoryStockTransactionType.TRANSFER_IN,
          quantityIn: 10,
          referenceType: 'StockTransfer',
          referenceId: 'transfer-1',
        },
      ]);

      expect(prisma.withTenantContext).toHaveBeenCalledTimes(1);
      expect(tx.inventoryStockLedgerEntry.create).toHaveBeenCalledTimes(2);
      expect(entries).toEqual([{ id: 'out-1' }, { id: 'in-1' }]);
    });

    it('stops at the first failing entry without posting the rest', async () => {
      tx.inventoryStockBalance.updateMany.mockResolvedValue({ count: 0 });
      tx.inventoryStockBalance.findUnique.mockResolvedValue({ quantity: 0 });

      await expect(
        repository.postEntries('tenant-1', [
          {
            warehouseId: 'wh-1',
            productId: 'prod-1',
            transactionType: InventoryStockTransactionType.TRANSFER_OUT,
            quantityOut: 10,
          },
          {
            warehouseId: 'wh-2',
            productId: 'prod-1',
            transactionType: InventoryStockTransactionType.TRANSFER_IN,
            quantityIn: 10,
          },
        ]),
      ).rejects.toThrow(InsufficientStockError);

      expect(tx.inventoryStockLedgerEntry.create).not.toHaveBeenCalled();
    });
  });

  describe('reverseEntry', () => {
    it('swaps quantities, applies the opposite balance delta, and links reversalOfId', async () => {
      tx.inventoryStockLedgerEntry.findFirst.mockResolvedValue({
        id: 'entry-1',
        warehouseId: 'wh-1',
        productId: 'prod-1',
        quantityIn: 100,
        quantityOut: 0,
        unitCost: 2.5,
        referenceType: 'GoodsReceipt',
        referenceId: 'grn-1',
      });
      tx.inventoryStockBalance.updateMany.mockResolvedValue({ count: 1 });
      tx.inventoryStockLedgerEntry.create.mockResolvedValue({ id: 'entry-2', reversalOfId: 'entry-1' });

      await repository.reverseEntry('tenant-1', 'entry-1', 'user-1', 'Wrong quantity entered');

      expect(tx.inventoryStockBalance.updateMany).toHaveBeenCalledWith({
        where: { tenantId: 'tenant-1', warehouseId: 'wh-1', productId: 'prod-1', quantity: { gte: 100 } },
        data: { quantity: { increment: -100 } },
      });
      expect(tx.inventoryStockLedgerEntry.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          transactionType: 'REVERSAL',
          quantityIn: 0,
          quantityOut: 100,
          reversalOfId: 'entry-1',
          actorUserId: 'user-1',
          note: 'Wrong quantity entered',
        }),
      });
    });

    it('throws NotFoundException when the original entry does not exist', async () => {
      tx.inventoryStockLedgerEntry.findFirst.mockResolvedValue(null);

      await expect(repository.reverseEntry('tenant-1', 'missing', 'user-1')).rejects.toThrow(NotFoundException);
    });

    it('throws ConflictException when the entry has already been reversed', async () => {
      tx.inventoryStockLedgerEntry.findFirst.mockResolvedValue({
        id: 'entry-1',
        warehouseId: 'wh-1',
        productId: 'prod-1',
        quantityIn: 100,
        quantityOut: 0,
        unitCost: null,
        referenceType: null,
        referenceId: null,
      });
      tx.inventoryStockBalance.updateMany.mockResolvedValue({ count: 1 });
      tx.inventoryStockLedgerEntry.create.mockRejectedValue(knownRequestError('P2002'));

      await expect(repository.reverseEntry('tenant-1', 'entry-1', 'user-1')).rejects.toThrow(ConflictException);
    });
  });

  describe('getBalance', () => {
    it('returns zero when no balance row exists', async () => {
      tx.inventoryStockBalance.findUnique.mockResolvedValue(null);

      await expect(repository.getBalance('tenant-1', 'wh-1', 'prod-1')).resolves.toBe(0);
    });

    it('returns the stored quantity as a number', async () => {
      tx.inventoryStockBalance.findUnique.mockResolvedValue({ quantity: { toString: () => '42' } });

      await expect(repository.getBalance('tenant-1', 'wh-1', 'prod-1')).resolves.toBe(42);
    });
  });
});
