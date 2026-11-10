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

/** issueFefo/transferFefo compare batch expiry against `new Date()` internally (not injectable), so batch fixtures for those tests use dates relative to the real clock rather than hardcoded calendar dates. */
function daysFromNow(days: number): Date {
  return new Date(Date.now() + days * 24 * 60 * 60 * 1000);
}

describe('InventoryStockRepository', () => {
  let repository: InventoryStockRepository;
  let tx: {
    inventoryStockBalance: { updateMany: jest.Mock; upsert: jest.Mock; findUnique: jest.Mock; findMany: jest.Mock };
    inventoryStockLedgerEntry: { create: jest.Mock; findFirst: jest.Mock; findMany: jest.Mock };
    inventoryStockBatch: {
      updateMany: jest.Mock;
      update: jest.Mock;
      create: jest.Mock;
      findUnique: jest.Mock;
      findMany: jest.Mock;
    };
    inventoryPurchaseOrderLine: { update: jest.Mock; findMany: jest.Mock };
    inventoryPurchaseOrder: { update: jest.Mock };
  };
  let prisma: { withTenantContext: jest.Mock };

  beforeEach(() => {
    tx = {
      inventoryStockBalance: { updateMany: jest.fn(), upsert: jest.fn(), findUnique: jest.fn(), findMany: jest.fn() },
      inventoryStockLedgerEntry: { create: jest.fn(), findFirst: jest.fn(), findMany: jest.fn() },
      inventoryStockBatch: {
        updateMany: jest.fn(),
        update: jest.fn(),
        create: jest.fn(),
        findUnique: jest.fn(),
        findMany: jest.fn(),
      },
      inventoryPurchaseOrderLine: { update: jest.fn(), findMany: jest.fn().mockResolvedValue([]) },
      inventoryPurchaseOrder: { update: jest.fn() },
    };
    prisma = { withTenantContext: jest.fn((_tenantId, fn) => fn(tx)) };
    repository = new InventoryStockRepository(prisma as unknown as PrismaService);
    tx.inventoryStockBalance.updateMany.mockResolvedValue({ count: 1 });
    tx.inventoryStockBatch.updateMany.mockResolvedValue({ count: 1 });
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

  describe('postEntry with receiveBatch', () => {
    it('creates a new batch, bumps its receivedQuantity/remainingQuantity, and links the ledger entry to it', async () => {
      tx.inventoryStockBatch.findUnique.mockResolvedValue(null);
      tx.inventoryStockBatch.create.mockResolvedValue({ id: 'batch-1' });
      tx.inventoryStockLedgerEntry.create.mockResolvedValue({ id: 'entry-1' });

      const expiryDate = new Date('2027-01-01');
      await repository.postEntry('tenant-1', {
        warehouseId: 'wh-1',
        productId: 'prod-1',
        transactionType: InventoryStockTransactionType.GOODS_RECEIVED,
        quantityIn: 500,
        unitCost: 1.2,
        receiveBatch: { batchNumber: 'LOT-001', expiryDate },
      });

      expect(tx.inventoryStockBatch.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          tenantId: 'tenant-1',
          productId: 'prod-1',
          warehouseId: 'wh-1',
          batchNumber: 'LOT-001',
          expiryDate,
          receivedQuantity: 500,
          remainingQuantity: 0,
          unitCost: 1.2,
        }),
      });
      expect(tx.inventoryStockBatch.update).toHaveBeenCalledWith({
        where: { id: 'batch-1' },
        data: { remainingQuantity: { increment: 500 } },
      });
      expect(tx.inventoryStockLedgerEntry.create).toHaveBeenCalledWith({
        data: expect.objectContaining({ batchId: 'batch-1', quantityIn: 500 }),
      });
    });

    it('replenishes an existing batch with a matching expiry date instead of creating a duplicate', async () => {
      const expiryDate = new Date('2027-01-01');
      tx.inventoryStockBatch.findUnique.mockResolvedValue({ id: 'batch-1', expiryDate, unitCost: 1.2 });
      tx.inventoryStockLedgerEntry.create.mockResolvedValue({ id: 'entry-1' });

      await repository.postEntry('tenant-1', {
        warehouseId: 'wh-1',
        productId: 'prod-1',
        transactionType: InventoryStockTransactionType.GOODS_RECEIVED,
        quantityIn: 200,
        receiveBatch: { batchNumber: 'LOT-001', expiryDate },
      });

      expect(tx.inventoryStockBatch.create).not.toHaveBeenCalled();
      expect(tx.inventoryStockBatch.update).toHaveBeenCalledWith({
        where: { id: 'batch-1' },
        data: { receivedQuantity: { increment: 200 }, unitCost: 1.2 },
      });
    });

    it('rejects re-receiving the same batch number with a different expiry date', async () => {
      tx.inventoryStockBatch.findUnique.mockResolvedValue({
        id: 'batch-1',
        expiryDate: new Date('2027-01-01'),
        unitCost: null,
      });

      await expect(
        repository.postEntry('tenant-1', {
          warehouseId: 'wh-1',
          productId: 'prod-1',
          transactionType: InventoryStockTransactionType.GOODS_RECEIVED,
          quantityIn: 200,
          receiveBatch: { batchNumber: 'LOT-001', expiryDate: new Date('2027-06-01') },
        }),
      ).rejects.toThrow(ConflictException);

      expect(tx.inventoryStockLedgerEntry.create).not.toHaveBeenCalled();
    });
  });

  describe('issueFefo', () => {
    it('allocates earliest-expiry-first and posts one entry per batch drawn from', async () => {
      tx.inventoryStockBatch.findMany.mockResolvedValue([
        { id: 'sooner', expiryDate: daysFromNow(30), remainingQuantity: 20 },
        { id: 'later', expiryDate: daysFromNow(200), remainingQuantity: 50 },
      ]);
      tx.inventoryStockLedgerEntry.create
        .mockResolvedValueOnce({ id: 'entry-1' })
        .mockResolvedValueOnce({ id: 'entry-2' });

      const entries = await repository.issueFefo('tenant-1', {
        warehouseId: 'wh-1',
        productId: 'prod-1',
        quantity: 35,
        transactionType: InventoryStockTransactionType.GOODS_ISSUED,
        note: 'Dispensed',
      });

      expect(entries).toHaveLength(2);
      expect(tx.inventoryStockBatch.updateMany).toHaveBeenNthCalledWith(1, {
        where: { id: 'sooner', tenantId: 'tenant-1', remainingQuantity: { gte: 20 } },
        data: { remainingQuantity: { increment: -20 } },
      });
      expect(tx.inventoryStockBatch.updateMany).toHaveBeenNthCalledWith(2, {
        where: { id: 'later', tenantId: 'tenant-1', remainingQuantity: { gte: 15 } },
        data: { remainingQuantity: { increment: -15 } },
      });
      expect(tx.inventoryStockLedgerEntry.create).toHaveBeenNthCalledWith(1, {
        data: expect.objectContaining({ batchId: 'sooner', quantityOut: 20, note: 'Dispensed' }),
      });
      expect(tx.inventoryStockLedgerEntry.create).toHaveBeenNthCalledWith(2, {
        data: expect.objectContaining({ batchId: 'later', quantityOut: 15, note: 'Dispensed' }),
      });
    });

    it('throws InsufficientStockError when non-expired batches cannot cover the request, without posting anything', async () => {
      tx.inventoryStockBatch.findMany.mockResolvedValue([
        { id: 'b1', expiryDate: daysFromNow(30), remainingQuantity: 5 },
      ]);

      await expect(
        repository.issueFefo('tenant-1', {
          warehouseId: 'wh-1',
          productId: 'prod-1',
          quantity: 10,
          transactionType: InventoryStockTransactionType.GOODS_ISSUED,
        }),
      ).rejects.toThrow(InsufficientStockError);

      expect(tx.inventoryStockLedgerEntry.create).not.toHaveBeenCalled();
    });
  });

  describe('transferFefo', () => {
    it('posts a TRANSFER_OUT/TRANSFER_IN pair per batch and opens a matching batch at the destination', async () => {
      tx.inventoryStockBatch.findMany.mockResolvedValue([
        { id: 'src-1', expiryDate: daysFromNow(30), remainingQuantity: 30, batchNumber: 'LOT-A', manufactureDate: null, unitCost: null },
      ]);
      tx.inventoryStockBatch.findUnique.mockResolvedValue(null);
      tx.inventoryStockBatch.create.mockResolvedValue({ id: 'dest-1' });
      tx.inventoryStockLedgerEntry.create
        .mockResolvedValueOnce({ id: 'out-1' })
        .mockResolvedValueOnce({ id: 'in-1' });

      const entries = await repository.transferFefo('tenant-1', {
        fromWarehouseId: 'wh-1',
        toWarehouseId: 'wh-2',
        productId: 'prod-1',
        quantity: 10,
      });

      expect(entries).toHaveLength(2);
      expect(tx.inventoryStockBatch.create).toHaveBeenCalledWith({
        data: expect.objectContaining({ warehouseId: 'wh-2', batchNumber: 'LOT-A', remainingQuantity: 0 }),
      });
      expect(tx.inventoryStockLedgerEntry.create).toHaveBeenNthCalledWith(1, {
        data: expect.objectContaining({
          warehouseId: 'wh-1',
          transactionType: 'TRANSFER_OUT',
          batchId: 'src-1',
          quantityOut: 10,
        }),
      });
      expect(tx.inventoryStockLedgerEntry.create).toHaveBeenNthCalledWith(2, {
        data: expect.objectContaining({
          warehouseId: 'wh-2',
          transactionType: 'TRANSFER_IN',
          batchId: 'dest-1',
          quantityIn: 10,
        }),
      });
      // Both legs share the same generated referenceId.
      const outCall = tx.inventoryStockLedgerEntry.create.mock.calls[0][0];
      const inCall = tx.inventoryStockLedgerEntry.create.mock.calls[1][0];
      expect(outCall.data.referenceId).toBe(inCall.data.referenceId);
    });
  });

  describe('reverseEntry with a batch-linked original', () => {
    it('restores the batch remainingQuantity in addition to the aggregate balance', async () => {
      tx.inventoryStockLedgerEntry.findFirst.mockResolvedValue({
        id: 'entry-1',
        warehouseId: 'wh-1',
        productId: 'prod-1',
        quantityIn: 0,
        quantityOut: 10,
        unitCost: null,
        referenceType: null,
        referenceId: null,
        batchId: 'batch-1',
      });
      tx.inventoryStockLedgerEntry.create.mockResolvedValue({ id: 'entry-2' });

      await repository.reverseEntry('tenant-1', 'entry-1', 'user-1', 'Not actually issued');

      expect(tx.inventoryStockBatch.updateMany).not.toHaveBeenCalled();
      expect(tx.inventoryStockBatch.update).toHaveBeenCalledWith({
        where: { id: 'batch-1' },
        data: { remainingQuantity: { increment: 10 } },
      });
      expect(tx.inventoryStockLedgerEntry.create).toHaveBeenCalledWith({
        data: expect.objectContaining({ batchId: 'batch-1' }),
      });
    });
  });

  describe('postEntry with purchaseOrderLineId', () => {
    it('bumps the line quantityReceived and marks the PO PARTIALLY_RECEIVED when some lines are still short', async () => {
      tx.inventoryPurchaseOrderLine.update.mockResolvedValue({
        id: 'line-1',
        purchaseOrderId: 'po-1',
        quantity: 100,
        quantityReceived: 40,
      });
      tx.inventoryPurchaseOrderLine.findMany.mockResolvedValue([
        { id: 'line-1', quantity: 100, quantityReceived: 40 },
        { id: 'line-2', quantity: 50, quantityReceived: 0 },
      ]);
      tx.inventoryStockLedgerEntry.create.mockResolvedValue({ id: 'entry-1' });

      await repository.postEntry('tenant-1', {
        warehouseId: 'wh-1',
        productId: 'prod-1',
        transactionType: InventoryStockTransactionType.GOODS_RECEIVED,
        quantityIn: 40,
        purchaseOrderLineId: 'line-1',
      });

      expect(tx.inventoryPurchaseOrderLine.update).toHaveBeenCalledWith({
        where: { id: 'line-1' },
        data: { quantityReceived: { increment: 40 } },
      });
      expect(tx.inventoryPurchaseOrder.update).toHaveBeenCalledWith({
        where: { id: 'po-1' },
        data: { status: 'PARTIALLY_RECEIVED' },
      });
      expect(tx.inventoryStockLedgerEntry.create).toHaveBeenCalledWith({
        data: expect.objectContaining({ purchaseOrderLineId: 'line-1' }),
      });
    });

    it('marks the PO RECEIVED once every line has met or exceeded its ordered quantity', async () => {
      tx.inventoryPurchaseOrderLine.update.mockResolvedValue({
        id: 'line-1',
        purchaseOrderId: 'po-1',
        quantity: 100,
        quantityReceived: 100,
      });
      tx.inventoryPurchaseOrderLine.findMany.mockResolvedValue([
        { id: 'line-1', quantity: 100, quantityReceived: 100 },
        { id: 'line-2', quantity: 50, quantityReceived: 50 },
      ]);
      tx.inventoryStockLedgerEntry.create.mockResolvedValue({ id: 'entry-1' });

      await repository.postEntry('tenant-1', {
        warehouseId: 'wh-1',
        productId: 'prod-1',
        transactionType: InventoryStockTransactionType.GOODS_RECEIVED,
        quantityIn: 60,
        purchaseOrderLineId: 'line-1',
      });

      expect(tx.inventoryPurchaseOrder.update).toHaveBeenCalledWith({
        where: { id: 'po-1' },
        data: { status: 'RECEIVED' },
      });
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
