import { PrismaService } from '@africahr/platform-database';
import { InventoryUnitConversionRepository } from './inventory-unit-conversion.repository';

describe('InventoryUnitConversionRepository', () => {
  let repository: InventoryUnitConversionRepository;
  let tx: { inventoryUnitConversion: { create: jest.Mock; findMany: jest.Mock; delete: jest.Mock } };
  let prisma: { withTenantContext: jest.Mock };

  beforeEach(() => {
    tx = { inventoryUnitConversion: { create: jest.fn(), findMany: jest.fn(), delete: jest.fn() } };
    prisma = { withTenantContext: jest.fn((_tenantId, fn) => fn(tx)) };
    repository = new InventoryUnitConversionRepository(prisma as unknown as PrismaService);
  });

  it('creates a conversion edge scoped to the tenant', async () => {
    await repository.create('tenant-1', { fromUnitId: 'carton', toUnitId: 'box', factor: 20, createdBy: 'user-1' });

    expect(tx.inventoryUnitConversion.create).toHaveBeenCalledWith({
      data: {
        tenantId: 'tenant-1',
        fromUnitId: 'carton',
        toUnitId: 'box',
        factor: 20,
        createdBy: 'user-1',
        updatedBy: 'user-1',
      },
    });
  });

  it('lists every conversion edge for the tenant, to build the full graph', async () => {
    await repository.list('tenant-1');

    expect(tx.inventoryUnitConversion.findMany).toHaveBeenCalledWith({ where: { tenantId: 'tenant-1' } });
  });
});
