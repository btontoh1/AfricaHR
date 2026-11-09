import { InventoryCategoryRepository } from '@africahr/inventory-data-access';
import { InventoryCategoryService } from './inventory-category.service';

describe('InventoryCategoryService', () => {
  let service: InventoryCategoryService;
  let categories: jest.Mocked<InventoryCategoryRepository>;

  beforeEach(() => {
    categories = {
      create: jest.fn(),
      list: jest.fn(),
      update: jest.fn(),
      softDelete: jest.fn(),
    } as unknown as jest.Mocked<InventoryCategoryRepository>;
    service = new InventoryCategoryService(categories);
  });

  it('creates a category attributed to the acting admin', async () => {
    await service.create('tenant-1', { name: 'Pharmaceuticals' }, 'user-1');

    expect(categories.create).toHaveBeenCalledWith('tenant-1', { name: 'Pharmaceuticals', createdBy: 'user-1' });
  });

  it('updates a category, including reparenting', async () => {
    await service.update('tenant-1', 'cat-1', { parentId: 'cat-parent' }, 'user-1');

    expect(categories.update).toHaveBeenCalledWith('tenant-1', 'cat-1', { parentId: 'cat-parent', updatedBy: 'user-1' });
  });
});
