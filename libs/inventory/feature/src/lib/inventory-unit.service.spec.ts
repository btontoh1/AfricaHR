import { InventoryUnitRepository } from '@africahr/inventory-data-access';
import { InventoryUnitService } from './inventory-unit.service';

describe('InventoryUnitService', () => {
  let service: InventoryUnitService;
  let units: jest.Mocked<InventoryUnitRepository>;

  beforeEach(() => {
    units = {
      create: jest.fn(),
      list: jest.fn(),
      update: jest.fn(),
      softDelete: jest.fn(),
    } as unknown as jest.Mocked<InventoryUnitRepository>;
    service = new InventoryUnitService(units);
  });

  it('creates a unit attributed to the acting admin', async () => {
    await service.create('tenant-1', { name: 'Box', abbreviation: 'box' }, 'user-1');

    expect(units.create).toHaveBeenCalledWith('tenant-1', { name: 'Box', abbreviation: 'box', createdBy: 'user-1' });
  });

  it('soft-deletes a unit', async () => {
    await service.remove('tenant-1', 'unit-1', 'user-1');

    expect(units.softDelete).toHaveBeenCalledWith('tenant-1', 'unit-1', 'user-1');
  });
});
