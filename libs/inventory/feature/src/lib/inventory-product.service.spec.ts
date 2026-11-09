import { ConflictException } from '@nestjs/common';
import { InventoryProduct } from '@prisma/client';
import { InventoryProductRepository } from '@africahr/inventory-data-access';
import { InventoryProductService } from './inventory-product.service';

describe('InventoryProductService', () => {
  let service: InventoryProductService;
  let products: jest.Mocked<InventoryProductRepository>;

  const dto = { sku: 'PARA-500', name: 'Paracetamol 500mg', baseUnitId: 'unit-1', purchasePrice: 2.5 };

  beforeEach(() => {
    products = {
      create: jest.fn(),
      findBySku: jest.fn(),
      list: jest.fn(),
      update: jest.fn(),
      softDelete: jest.fn(),
    } as unknown as jest.Mocked<InventoryProductRepository>;
    service = new InventoryProductService(products);
  });

  it('creates a product when the SKU is not already used in the tenant', async () => {
    products.findBySku.mockResolvedValue(null);

    await service.create('tenant-1', dto, 'user-1');

    expect(products.findBySku).toHaveBeenCalledWith('tenant-1', 'PARA-500');
    expect(products.create).toHaveBeenCalledWith('tenant-1', { ...dto, createdBy: 'user-1' });
  });

  it('rejects a duplicate SKU within the same tenant', async () => {
    products.findBySku.mockResolvedValue({ id: 'existing' } as InventoryProduct);

    await expect(service.create('tenant-1', dto, 'user-1')).rejects.toThrow(ConflictException);
    expect(products.create).not.toHaveBeenCalled();
  });
});
