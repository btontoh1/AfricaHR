import { InventoryVendorRepository } from '@africahr/inventory-data-access';
import { InventoryVendorService } from './inventory-vendor.service';

describe('InventoryVendorService', () => {
  let service: InventoryVendorService;
  let vendors: jest.Mocked<InventoryVendorRepository>;

  beforeEach(() => {
    vendors = { list: jest.fn() } as unknown as jest.Mocked<InventoryVendorRepository>;
    service = new InventoryVendorService(vendors);
  });

  it('delegates list to the repository', async () => {
    await service.list('tenant-1', 'org-1');

    expect(vendors.list).toHaveBeenCalledWith('tenant-1', 'org-1');
  });
});
