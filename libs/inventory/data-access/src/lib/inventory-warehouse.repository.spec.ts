import { PrismaService } from '@africahr/platform-database';
import { InventoryWarehouseRepository } from './inventory-warehouse.repository';

describe('InventoryWarehouseRepository', () => {
  let repository: InventoryWarehouseRepository;
  let tx: { inventoryWarehouse: { create: jest.Mock; findMany: jest.Mock } };
  let prisma: { withTenantContext: jest.Mock };

  beforeEach(() => {
    tx = { inventoryWarehouse: { create: jest.fn(), findMany: jest.fn() } };
    prisma = { withTenantContext: jest.fn((_tenantId, fn) => fn(tx)) };
    repository = new InventoryWarehouseRepository(prisma as unknown as PrismaService);
  });

  it('creates a warehouse scoped to the tenant and organization', async () => {
    await repository.create('tenant-1', { organizationId: 'org-1', name: 'Accra Central', code: 'ACC-01', createdBy: 'user-1' });

    expect(tx.inventoryWarehouse.create).toHaveBeenCalledWith({
      data: {
        tenantId: 'tenant-1',
        organizationId: 'org-1',
        name: 'Accra Central',
        code: 'ACC-01',
        managerEmployeeId: undefined,
        address: undefined,
        phone: undefined,
        createdBy: 'user-1',
        updatedBy: 'user-1',
      },
    });
  });

  it('lists warehouses, optionally scoped to one organization', async () => {
    await repository.list('tenant-1', 'org-1');

    expect(tx.inventoryWarehouse.findMany).toHaveBeenCalledWith({
      where: { tenantId: 'tenant-1', organizationId: 'org-1', deletedAt: null },
      orderBy: { name: 'asc' },
    });
  });
});
