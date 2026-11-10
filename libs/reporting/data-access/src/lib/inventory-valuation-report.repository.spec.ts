import { PrismaService } from '@africahr/platform-database';
import { InventoryValuationReportRepository } from './inventory-valuation-report.repository';

function decimal(value: number) {
  return { toNumber: () => value };
}

describe('InventoryValuationReportRepository', () => {
  let repository: InventoryValuationReportRepository;
  let tx: {
    inventoryStockBalance: { findMany: jest.Mock };
    inventoryStockBatch: { findMany: jest.Mock };
    inventoryStockLedgerEntry: { findFirst: jest.Mock };
  };
  let prisma: { withTenantContext: jest.Mock };

  beforeEach(() => {
    tx = {
      inventoryStockBalance: { findMany: jest.fn() },
      inventoryStockBatch: { findMany: jest.fn() },
      inventoryStockLedgerEntry: { findFirst: jest.fn() },
    };
    prisma = { withTenantContext: jest.fn((_tenantId, fn) => fn(tx)) };
    repository = new InventoryValuationReportRepository(prisma as unknown as PrismaService);
  });

  it('returns an empty array when there is no stock on hand', async () => {
    tx.inventoryStockBalance.findMany.mockResolvedValue([]);

    const result = await repository.listValuation('tenant-1');

    expect(result).toEqual([]);
  });

  it('uses the weighted-average remaining-batch cost for a batch-tracked product', async () => {
    tx.inventoryStockBalance.findMany.mockResolvedValue([
      {
        warehouseId: 'wh-1',
        productId: 'prod-1',
        quantity: decimal(100),
        warehouse: { name: 'Main Warehouse' },
        product: { sku: 'PARA-500', name: 'Paracetamol 500mg', tracksBatch: true, purchasePrice: decimal(1) },
      },
    ]);
    tx.inventoryStockBatch.findMany.mockResolvedValue([
      { unitCost: decimal(10), remainingQuantity: decimal(60) },
      { unitCost: decimal(20), remainingQuantity: decimal(40) },
    ]);

    const result = await repository.listValuation('tenant-1');

    // (10*60 + 20*40) / 100 = 14
    expect(result).toEqual([
      {
        warehouseId: 'wh-1',
        warehouseName: 'Main Warehouse',
        productId: 'prod-1',
        productSku: 'PARA-500',
        productName: 'Paracetamol 500mg',
        quantity: 100,
        unitCost: 14,
        totalValue: 1400,
      },
    ]);
  });

  it('uses the most recent GOODS_RECEIVED ledger unitCost for a non-tracked product', async () => {
    tx.inventoryStockBalance.findMany.mockResolvedValue([
      {
        warehouseId: 'wh-1',
        productId: 'prod-2',
        quantity: decimal(50),
        warehouse: { name: 'Main Warehouse' },
        product: { sku: 'PEN-001', name: 'Pens (box)', tracksBatch: false, purchasePrice: decimal(2) },
      },
    ]);
    tx.inventoryStockLedgerEntry.findFirst.mockResolvedValue({ unitCost: decimal(5) });

    const result = await repository.listValuation('tenant-1');

    expect(result[0]).toMatchObject({ unitCost: 5, totalValue: 250 });
  });

  it('falls back to the product purchasePrice when no batch/ledger cost exists', async () => {
    tx.inventoryStockBalance.findMany.mockResolvedValue([
      {
        warehouseId: 'wh-1',
        productId: 'prod-3',
        quantity: decimal(10),
        warehouse: { name: 'Main Warehouse' },
        product: { sku: 'MISC-001', name: 'Misc Item', tracksBatch: false, purchasePrice: decimal(3.5) },
      },
    ]);
    tx.inventoryStockLedgerEntry.findFirst.mockResolvedValue(null);

    const result = await repository.listValuation('tenant-1');

    expect(result[0]).toMatchObject({ unitCost: 3.5, totalValue: 35 });
  });
});
