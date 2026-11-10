import { PrismaService } from '@africahr/platform-database';
import { LowStockReportRepository } from './low-stock-report.repository';

function decimal(value: number) {
  return { toNumber: () => value };
}

describe('LowStockReportRepository', () => {
  let repository: LowStockReportRepository;
  let tx: { inventoryStockBalance: { findMany: jest.Mock } };
  let prisma: { withTenantContext: jest.Mock };

  beforeEach(() => {
    tx = { inventoryStockBalance: { findMany: jest.fn() } };
    prisma = { withTenantContext: jest.fn((_tenantId, fn) => fn(tx)) };
    repository = new LowStockReportRepository(prisma as unknown as PrismaService);
  });

  it('returns an empty array when nothing is below its threshold', async () => {
    tx.inventoryStockBalance.findMany.mockResolvedValue([
      {
        warehouseId: 'wh-1',
        productId: 'prod-1',
        quantity: decimal(50),
        warehouse: { name: 'Main Warehouse' },
        product: { sku: 'PARA-500', name: 'Paracetamol 500mg', minStockLevel: decimal(20) },
      },
    ]);

    const result = await repository.listLowStock('tenant-1');

    expect(result).toEqual([]);
  });

  it('returns rows below minStockLevel sorted by shortfall descending', async () => {
    tx.inventoryStockBalance.findMany.mockResolvedValue([
      {
        warehouseId: 'wh-1',
        productId: 'prod-1',
        quantity: decimal(5),
        warehouse: { name: 'Main Warehouse' },
        product: { sku: 'PARA-500', name: 'Paracetamol 500mg', minStockLevel: decimal(20) },
      },
      {
        warehouseId: 'wh-1',
        productId: 'prod-2',
        quantity: decimal(1),
        warehouse: { name: 'Main Warehouse' },
        product: { sku: 'GLV-001', name: 'Gloves (box)', minStockLevel: decimal(50) },
      },
    ]);

    const result = await repository.listLowStock('tenant-1');

    expect(result).toEqual([
      {
        warehouseId: 'wh-1',
        warehouseName: 'Main Warehouse',
        productId: 'prod-2',
        productSku: 'GLV-001',
        productName: 'Gloves (box)',
        quantity: 1,
        minStockLevel: 50,
        shortfall: 49,
      },
      {
        warehouseId: 'wh-1',
        warehouseName: 'Main Warehouse',
        productId: 'prod-1',
        productSku: 'PARA-500',
        productName: 'Paracetamol 500mg',
        quantity: 5,
        minStockLevel: 20,
        shortfall: 15,
      },
    ]);
  });

  it('only queries products with a minStockLevel set', async () => {
    tx.inventoryStockBalance.findMany.mockResolvedValue([]);

    await repository.listLowStock('tenant-1', { warehouseId: 'wh-1' });

    expect(tx.inventoryStockBalance.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          warehouseId: 'wh-1',
          product: { minStockLevel: { not: null } },
        }),
      }),
    );
  });
});
