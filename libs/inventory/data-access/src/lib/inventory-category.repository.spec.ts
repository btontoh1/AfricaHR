import { PrismaService } from '@africahr/platform-database';
import { InventoryCategoryRepository } from './inventory-category.repository';

describe('InventoryCategoryRepository', () => {
  let repository: InventoryCategoryRepository;
  let tx: { inventoryCategory: { create: jest.Mock; findMany: jest.Mock; update: jest.Mock } };
  let prisma: { withTenantContext: jest.Mock };

  beforeEach(() => {
    tx = { inventoryCategory: { create: jest.fn(), findMany: jest.fn(), update: jest.fn() } };
    prisma = { withTenantContext: jest.fn((_tenantId, fn) => fn(tx)) };
    repository = new InventoryCategoryRepository(prisma as unknown as PrismaService);
  });

  it('creates a category with an optional parent, scoped to the tenant', async () => {
    await repository.create('tenant-1', { name: 'Pharmaceuticals', parentId: null, createdBy: 'user-1' });

    expect(tx.inventoryCategory.create).toHaveBeenCalledWith({
      data: { tenantId: 'tenant-1', name: 'Pharmaceuticals', parentId: null, createdBy: 'user-1', updatedBy: 'user-1' },
    });
  });

  it('updates a category, including reparenting via parentId', async () => {
    await repository.update('tenant-1', 'cat-1', { parentId: 'cat-parent', updatedBy: 'user-1' });

    expect(tx.inventoryCategory.update).toHaveBeenCalledWith({
      where: { id: 'cat-1' },
      data: {
        name: undefined,
        parentId: 'cat-parent',
        isActive: undefined,
        updatedBy: 'user-1',
      },
    });
  });
});
