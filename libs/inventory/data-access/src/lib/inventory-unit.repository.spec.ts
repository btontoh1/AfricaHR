import { PrismaService } from '@africahr/platform-database';
import { InventoryUnitRepository } from './inventory-unit.repository';

describe('InventoryUnitRepository', () => {
  let repository: InventoryUnitRepository;
  let tx: { inventoryUnit: { create: jest.Mock; findFirst: jest.Mock; findMany: jest.Mock; update: jest.Mock } };
  let prisma: { withTenantContext: jest.Mock };

  beforeEach(() => {
    tx = { inventoryUnit: { create: jest.fn(), findFirst: jest.fn(), findMany: jest.fn(), update: jest.fn() } };
    prisma = { withTenantContext: jest.fn((_tenantId, fn) => fn(tx)) };
    repository = new InventoryUnitRepository(prisma as unknown as PrismaService);
  });

  it('creates a unit scoped to the tenant', async () => {
    await repository.create('tenant-1', { name: 'Box', abbreviation: 'box', createdBy: 'user-1' });

    expect(prisma.withTenantContext).toHaveBeenCalledWith('tenant-1', expect.any(Function));
    expect(tx.inventoryUnit.create).toHaveBeenCalledWith({
      data: { tenantId: 'tenant-1', name: 'Box', abbreviation: 'box', createdBy: 'user-1', updatedBy: 'user-1' },
    });
  });

  it('lists only non-deleted units for the tenant', async () => {
    await repository.list('tenant-1');

    expect(tx.inventoryUnit.findMany).toHaveBeenCalledWith({
      where: { tenantId: 'tenant-1', deletedAt: null },
      orderBy: { name: 'asc' },
    });
  });

  it('soft-deletes by setting deletedAt', async () => {
    await repository.softDelete('tenant-1', 'unit-1', 'user-1');

    expect(tx.inventoryUnit.update).toHaveBeenCalledWith({
      where: { id: 'unit-1' },
      data: { deletedAt: expect.any(Date), updatedBy: 'user-1' },
    });
  });
});
