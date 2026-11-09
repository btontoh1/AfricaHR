import { Module } from '@nestjs/common';
import { PlatformAuthModule } from '@africahr/platform-auth';
import { InventoryDataAccessModule } from '@africahr/inventory-data-access';
import { InventoryUnitService } from './inventory-unit.service';
import { InventoryUnitConversionService } from './inventory-unit-conversion.service';
import { InventoryCategoryService } from './inventory-category.service';
import { InventoryProductService } from './inventory-product.service';
import { InventoryWarehouseService } from './inventory-warehouse.service';
import { InventoryStockService } from './inventory-stock.service';
import { InventoryUnitController } from './inventory-unit.controller';
import { InventoryUnitConversionController } from './inventory-unit-conversion.controller';
import { InventoryCategoryController } from './inventory-category.controller';
import { InventoryProductController } from './inventory-product.controller';
import { InventoryWarehouseController } from './inventory-warehouse.controller';
import { InventoryStockController } from './inventory-stock.controller';

@Module({
  imports: [PlatformAuthModule, InventoryDataAccessModule],
  controllers: [
    InventoryUnitController,
    InventoryUnitConversionController,
    InventoryCategoryController,
    InventoryProductController,
    InventoryWarehouseController,
    InventoryStockController,
  ],
  providers: [
    InventoryUnitService,
    InventoryUnitConversionService,
    InventoryCategoryService,
    InventoryProductService,
    InventoryWarehouseService,
    InventoryStockService,
  ],
  exports: [
    InventoryUnitService,
    InventoryUnitConversionService,
    InventoryCategoryService,
    InventoryProductService,
    InventoryWarehouseService,
    InventoryStockService,
  ],
})
export class InventoryFeatureModule {}
