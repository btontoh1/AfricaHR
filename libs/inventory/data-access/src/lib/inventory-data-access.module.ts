import { Module } from '@nestjs/common';
import { PrismaModule } from '@africahr/platform-database';
import { InventoryUnitRepository } from './inventory-unit.repository';
import { InventoryUnitConversionRepository } from './inventory-unit-conversion.repository';
import { InventoryCategoryRepository } from './inventory-category.repository';
import { InventoryProductRepository } from './inventory-product.repository';
import { InventoryWarehouseRepository } from './inventory-warehouse.repository';
import { InventoryStockRepository } from './inventory-stock.repository';

@Module({
  imports: [PrismaModule],
  providers: [
    InventoryUnitRepository,
    InventoryUnitConversionRepository,
    InventoryCategoryRepository,
    InventoryProductRepository,
    InventoryWarehouseRepository,
    InventoryStockRepository,
  ],
  exports: [
    InventoryUnitRepository,
    InventoryUnitConversionRepository,
    InventoryCategoryRepository,
    InventoryProductRepository,
    InventoryWarehouseRepository,
    InventoryStockRepository,
  ],
})
export class InventoryDataAccessModule {}
