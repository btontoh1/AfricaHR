import { PrismaService } from '@africahr/platform-database';
import { InventoryProductRepository } from './inventory-product.repository';

describe('InventoryProductRepository', () => {
  let repository: InventoryProductRepository;
  let tx: { inventoryProduct: { create: jest.Mock; findFirst: jest.Mock; findMany: jest.Mock; update: jest.Mock } };
  let prisma: { withTenantContext: jest.Mock };

  beforeEach(() => {
    tx = { inventoryProduct: { create: jest.fn(), findFirst: jest.fn(), findMany: jest.fn(), update: jest.fn() } };
    prisma = { withTenantContext: jest.fn((_tenantId, fn) => fn(tx)) };
    repository = new InventoryProductRepository(prisma as unknown as PrismaService);
  });

  it('creates a product scoped to the tenant, defaulting tracksBatch to false', async () => {
    await repository.create('tenant-1', {
      sku: 'PARA-500',
      name: 'Paracetamol 500mg',
      baseUnitId: 'unit-1',
      purchasePrice: 2.5,
      createdBy: 'user-1',
    });

    expect(tx.inventoryProduct.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        tenantId: 'tenant-1',
        sku: 'PARA-500',
        name: 'Paracetamol 500mg',
        baseUnitId: 'unit-1',
        purchasePrice: 2.5,
        tracksBatch: false,
      }),
    });
  });

  it('looks up a product by SKU within the tenant only, to check for duplicates before create', async () => {
    await repository.findBySku('tenant-1', 'PARA-500');

    expect(tx.inventoryProduct.findFirst).toHaveBeenCalledWith({
      where: { tenantId: 'tenant-1', sku: 'PARA-500', deletedAt: null },
    });
  });
});
