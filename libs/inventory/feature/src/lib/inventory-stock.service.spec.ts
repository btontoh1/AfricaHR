import { BadRequestException, NotFoundException } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { InventoryStockTransactionType } from '@prisma/client';
import {
  InventoryProductRepository,
  InventoryPurchaseOrderRepository,
  InventoryStockBatchRepository,
  InventoryStockRepository,
} from '@africahr/inventory-data-access';
import { INVENTORY_GOODS_RECEIVED_EVENT, InventoryStockService } from './inventory-stock.service';

describe('InventoryStockService', () => {
  let service: InventoryStockService;
  let stock: jest.Mocked<InventoryStockRepository>;
  let batches: jest.Mocked<InventoryStockBatchRepository>;
  let products: jest.Mocked<InventoryProductRepository>;
  let purchaseOrders: jest.Mocked<InventoryPurchaseOrderRepository>;
  let eventEmitter: jest.Mocked<EventEmitter2>;

  const plainProduct = { id: 'prod-1', sku: 'PARA-500', name: 'Paracetamol 500mg', tracksBatch: false };
  const batchTrackedProduct = { id: 'prod-1', sku: 'PARA-500', name: 'Paracetamol 500mg', tracksBatch: true };

  beforeEach(() => {
    stock = {
      postEntry: jest.fn(),
      postEntries: jest.fn(),
      issueFefo: jest.fn(),
      transferFefo: jest.fn(),
      reverseEntry: jest.fn(),
      getBalance: jest.fn(),
      listBalances: jest.fn(),
      listLedgerEntries: jest.fn(),
    } as unknown as jest.Mocked<InventoryStockRepository>;
    batches = { list: jest.fn() } as unknown as jest.Mocked<InventoryStockBatchRepository>;
    products = { findById: jest.fn() } as unknown as jest.Mocked<InventoryProductRepository>;
    purchaseOrders = {
      findLineById: jest.fn(),
      findById: jest.fn(),
    } as unknown as jest.Mocked<InventoryPurchaseOrderRepository>;
    eventEmitter = { emit: jest.fn() } as unknown as jest.Mocked<EventEmitter2>;
    service = new InventoryStockService(stock, batches, products, purchaseOrders, eventEmitter);
  });

  describe('receiveGoods', () => {
    it('posts a GOODS_RECEIVED entry with no batch info for a plain product', async () => {
      products.findById.mockResolvedValue(plainProduct as never);

      await service.receiveGoods(
        'tenant-1',
        { warehouseId: 'wh-1', productId: 'prod-1', quantity: 100, unitCost: 2.5, referenceId: 'GRN-001' },
        'user-1',
      );

      expect(stock.postEntry).toHaveBeenCalledWith('tenant-1', {
        warehouseId: 'wh-1',
        productId: 'prod-1',
        transactionType: InventoryStockTransactionType.GOODS_RECEIVED,
        quantityIn: 100,
        unitCost: 2.5,
        referenceId: 'GRN-001',
        note: undefined,
        actorUserId: 'user-1',
      });
    });

    it('carries batchNumber/expiryDate through as receiveBatch for a batch-tracked product', async () => {
      products.findById.mockResolvedValue(batchTrackedProduct as never);

      await service.receiveGoods(
        'tenant-1',
        {
          warehouseId: 'wh-1',
          productId: 'prod-1',
          quantity: 500,
          batchNumber: 'LOT-001',
          expiryDate: '2027-01-01',
          manufactureDate: '2026-01-01',
        },
        'user-1',
      );

      expect(stock.postEntry).toHaveBeenCalledWith(
        'tenant-1',
        expect.objectContaining({
          quantityIn: 500,
          receiveBatch: {
            batchNumber: 'LOT-001',
            expiryDate: new Date('2027-01-01'),
            manufactureDate: new Date('2026-01-01'),
          },
        }),
      );
    });

    it('rejects a batch-tracked receipt missing batchNumber/expiryDate', async () => {
      products.findById.mockResolvedValue(batchTrackedProduct as never);

      await expect(
        service.receiveGoods('tenant-1', { warehouseId: 'wh-1', productId: 'prod-1', quantity: 500 }, 'user-1'),
      ).rejects.toThrow(BadRequestException);

      expect(stock.postEntry).not.toHaveBeenCalled();
    });

    it('throws NotFoundException for an unknown product', async () => {
      products.findById.mockResolvedValue(null);

      await expect(
        service.receiveGoods('tenant-1', { warehouseId: 'wh-1', productId: 'missing', quantity: 1 }, 'user-1'),
      ).rejects.toThrow(NotFoundException);
    });

    it('does not emit INVENTORY_GOODS_RECEIVED_EVENT when purchaseOrderLineId is not set', async () => {
      products.findById.mockResolvedValue(plainProduct as never);
      stock.postEntry.mockResolvedValue({ id: 'entry-1' } as never);

      await service.receiveGoods(
        'tenant-1',
        { warehouseId: 'wh-1', productId: 'prod-1', quantity: 100, unitCost: 2.5 },
        'user-1',
      );

      expect(eventEmitter.emit).not.toHaveBeenCalled();
      expect(purchaseOrders.findLineById).not.toHaveBeenCalled();
    });

    it('emits INVENTORY_GOODS_RECEIVED_EVENT with the receipt unitCost when purchaseOrderLineId is set', async () => {
      products.findById.mockResolvedValue(plainProduct as never);
      stock.postEntry.mockResolvedValue({ id: 'entry-1' } as never);
      purchaseOrders.findLineById.mockResolvedValue({
        id: 'line-1',
        purchaseOrderId: 'po-1',
        unitCost: 9.99,
      } as never);
      purchaseOrders.findById.mockResolvedValue({
        id: 'po-1',
        organizationId: 'org-1',
        poNumber: 'PO-0001',
        vendorId: 'vendor-1',
      } as never);

      await service.receiveGoods(
        'tenant-1',
        {
          warehouseId: 'wh-1',
          productId: 'prod-1',
          quantity: 20,
          unitCost: 2.5,
          purchaseOrderLineId: 'line-1',
        },
        'user-1',
      );

      expect(purchaseOrders.findLineById).toHaveBeenCalledWith('tenant-1', 'line-1');
      expect(purchaseOrders.findById).toHaveBeenCalledWith('tenant-1', 'po-1');
      expect(eventEmitter.emit).toHaveBeenCalledWith(
        INVENTORY_GOODS_RECEIVED_EVENT,
        expect.objectContaining({
          tenantId: 'tenant-1',
          organizationId: 'org-1',
          purchaseOrderId: 'po-1',
          poNumber: 'PO-0001',
          vendorId: 'vendor-1',
          warehouseId: 'wh-1',
          productId: 'prod-1',
          productName: 'PARA-500 - Paracetamol 500mg',
          quantity: 20,
          unitCost: 2.5,
          ledgerEntryId: 'entry-1',
        }),
      );
    });

    it('falls back to the PO line unitCost when the receipt did not specify one', async () => {
      products.findById.mockResolvedValue(plainProduct as never);
      stock.postEntry.mockResolvedValue({ id: 'entry-1' } as never);
      purchaseOrders.findLineById.mockResolvedValue({
        id: 'line-1',
        purchaseOrderId: 'po-1',
        unitCost: 9.99,
      } as never);
      purchaseOrders.findById.mockResolvedValue({
        id: 'po-1',
        organizationId: 'org-1',
        poNumber: 'PO-0001',
        vendorId: 'vendor-1',
      } as never);

      await service.receiveGoods(
        'tenant-1',
        { warehouseId: 'wh-1', productId: 'prod-1', quantity: 20, purchaseOrderLineId: 'line-1' },
        'user-1',
      );

      expect(eventEmitter.emit).toHaveBeenCalledWith(
        INVENTORY_GOODS_RECEIVED_EVENT,
        expect.objectContaining({ unitCost: 9.99 }),
      );
    });

    it('swallows an error while emitting the PO-receipt event rather than failing the receipt', async () => {
      products.findById.mockResolvedValue(plainProduct as never);
      stock.postEntry.mockResolvedValue({ id: 'entry-1' } as never);
      purchaseOrders.findLineById.mockRejectedValue(new Error('db unavailable'));

      const entry = await service.receiveGoods(
        'tenant-1',
        { warehouseId: 'wh-1', productId: 'prod-1', quantity: 20, purchaseOrderLineId: 'line-1' },
        'user-1',
      );

      expect(entry).toEqual({ id: 'entry-1' });
      expect(eventEmitter.emit).not.toHaveBeenCalled();
    });
  });

  describe('issueGoods', () => {
    it('posts a single GOODS_ISSUED entry, wrapped in an array, for a plain product', async () => {
      products.findById.mockResolvedValue(plainProduct as never);
      stock.postEntry.mockResolvedValue({ id: 'entry-1' } as never);

      const entries = await service.issueGoods(
        'tenant-1',
        { warehouseId: 'wh-1', productId: 'prod-1', quantity: 30, reason: 'Departmental consumption - IT' },
        'user-1',
      );

      expect(stock.postEntry).toHaveBeenCalledWith('tenant-1', {
        warehouseId: 'wh-1',
        productId: 'prod-1',
        transactionType: InventoryStockTransactionType.GOODS_ISSUED,
        quantityOut: 30,
        note: 'Departmental consumption - IT',
        actorUserId: 'user-1',
      });
      expect(entries).toEqual([{ id: 'entry-1' }]);
    });

    it('delegates to issueFefo for a batch-tracked product', async () => {
      products.findById.mockResolvedValue(batchTrackedProduct as never);
      stock.issueFefo.mockResolvedValue([{ id: 'entry-1' }, { id: 'entry-2' }] as never);

      const entries = await service.issueGoods(
        'tenant-1',
        { warehouseId: 'wh-1', productId: 'prod-1', quantity: 30, reason: 'Dispensed' },
        'user-1',
      );

      expect(stock.issueFefo).toHaveBeenCalledWith('tenant-1', {
        warehouseId: 'wh-1',
        productId: 'prod-1',
        quantity: 30,
        transactionType: InventoryStockTransactionType.GOODS_ISSUED,
        note: 'Dispensed',
        actorUserId: 'user-1',
      });
      expect(stock.postEntry).not.toHaveBeenCalled();
      expect(entries).toEqual([{ id: 'entry-1' }, { id: 'entry-2' }]);
    });
  });

  describe('transferStock', () => {
    it('posts a transfer as a TRANSFER_OUT and TRANSFER_IN pair sharing one reference id for a plain product', async () => {
      products.findById.mockResolvedValue(plainProduct as never);

      await service.transferStock(
        'tenant-1',
        { fromWarehouseId: 'wh-1', toWarehouseId: 'wh-2', productId: 'prod-1', quantity: 10 },
        'user-1',
      );

      expect(stock.postEntries).toHaveBeenCalledTimes(1);
      const [, entries] = stock.postEntries.mock.calls[0];
      expect(entries).toHaveLength(2);
      expect(entries[0]).toMatchObject({
        warehouseId: 'wh-1',
        transactionType: InventoryStockTransactionType.TRANSFER_OUT,
        quantityOut: 10,
        referenceType: 'StockTransfer',
      });
      expect(entries[1]).toMatchObject({
        warehouseId: 'wh-2',
        transactionType: InventoryStockTransactionType.TRANSFER_IN,
        quantityIn: 10,
        referenceType: 'StockTransfer',
      });
      expect(entries[0].referenceId).toBe(entries[1].referenceId);
      expect(stock.transferFefo).not.toHaveBeenCalled();
    });

    it('delegates to transferFefo for a batch-tracked product', async () => {
      products.findById.mockResolvedValue(batchTrackedProduct as never);
      stock.transferFefo.mockResolvedValue([{ id: 'out-1' }, { id: 'in-1' }] as never);

      const entries = await service.transferStock(
        'tenant-1',
        { fromWarehouseId: 'wh-1', toWarehouseId: 'wh-2', productId: 'prod-1', quantity: 10 },
        'user-1',
      );

      expect(stock.transferFefo).toHaveBeenCalledWith('tenant-1', {
        fromWarehouseId: 'wh-1',
        toWarehouseId: 'wh-2',
        productId: 'prod-1',
        quantity: 10,
        note: undefined,
        actorUserId: 'user-1',
      });
      expect(stock.postEntries).not.toHaveBeenCalled();
      expect(entries).toEqual([{ id: 'out-1' }, { id: 'in-1' }]);
    });
  });

  it('delegates reverseEntry with the reason as the note', async () => {
    await service.reverseEntry('tenant-1', 'entry-1', 'Wrong quantity entered', 'user-1');

    expect(stock.reverseEntry).toHaveBeenCalledWith('tenant-1', 'entry-1', 'user-1', 'Wrong quantity entered');
  });

  it('delegates listBatches to the batch repository', async () => {
    batches.list.mockResolvedValue([]);

    await service.listBatches('tenant-1', { productId: 'prod-1' });

    expect(batches.list).toHaveBeenCalledWith('tenant-1', { productId: 'prod-1' });
  });
});
