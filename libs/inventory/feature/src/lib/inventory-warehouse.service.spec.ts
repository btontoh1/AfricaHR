import { InventoryWarehouseRepository } from '@africahr/inventory-data-access';
import { InventoryWarehouseService } from './inventory-warehouse.service';

describe('InventoryWarehouseService', () => {
  let service: InventoryWarehouseService;
  let warehouses: jest.Mocked<InventoryWarehouseRepository>;

  beforeEach(() => {
    warehouses = {
      create: jest.fn(),
      list: jest.fn(),
      update: jest.fn(),
      softDelete: jest.fn(),
    } as unknown as jest.Mocked<InventoryWarehouseRepository>;
    service = new InventoryWarehouseService(warehouses);
  });

  it('creates a warehouse attributed to the acting admin', async () => {
    await service.create('tenant-1', { organizationId: 'org-1', name: 'Accra Central', code: 'ACC-01' }, 'user-1');

    expect(warehouses.create).toHaveBeenCalledWith('tenant-1', {
      organizationId: 'org-1',
      name: 'Accra Central',
      code: 'ACC-01',
      createdBy: 'user-1',
    });
  });

  it('lists warehouses scoped to an organization', async () => {
    await service.list('tenant-1', 'org-1');

    expect(warehouses.list).toHaveBeenCalledWith('tenant-1', 'org-1');
  });
});
