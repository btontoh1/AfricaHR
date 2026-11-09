import { ConflictException } from '@nestjs/common';
import { InventoryUnitConversion } from '@prisma/client';
import { InventoryUnitConversionRepository } from '@africahr/inventory-data-access';
import { InventoryUnitConversionService } from './inventory-unit-conversion.service';

describe('InventoryUnitConversionService', () => {
  let service: InventoryUnitConversionService;
  let conversions: jest.Mocked<InventoryUnitConversionRepository>;

  beforeEach(() => {
    conversions = {
      create: jest.fn(),
      list: jest.fn(),
      delete: jest.fn(),
    } as unknown as jest.Mocked<InventoryUnitConversionRepository>;
    service = new InventoryUnitConversionService(conversions);
  });

  it('creates a conversion edge that extends the graph without looping', async () => {
    conversions.list.mockResolvedValue([
      { fromUnitId: 'carton', toUnitId: 'box', factor: 20 } as unknown as InventoryUnitConversion,
    ]);

    await service.create('tenant-1', { fromUnitId: 'box', toUnitId: 'strip', factor: 10 }, 'user-1');

    expect(conversions.create).toHaveBeenCalledWith('tenant-1', {
      fromUnitId: 'box',
      toUnitId: 'strip',
      factor: 10,
      createdBy: 'user-1',
    });
  });

  it('rejects an edge that would create a cycle with an existing conversion', async () => {
    conversions.list.mockResolvedValue([
      { fromUnitId: 'carton', toUnitId: 'box', factor: 20 } as unknown as InventoryUnitConversion,
      { fromUnitId: 'box', toUnitId: 'strip', factor: 10 } as unknown as InventoryUnitConversion,
    ]);

    await expect(
      service.create('tenant-1', { fromUnitId: 'strip', toUnitId: 'carton', factor: 0.005 }, 'user-1'),
    ).rejects.toThrow(ConflictException);
    expect(conversions.create).not.toHaveBeenCalled();
  });
});
