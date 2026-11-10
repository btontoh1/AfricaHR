import { Module } from '@nestjs/common';
import { PlatformAuthModule } from '@africahr/platform-auth';
import { InventoryDataAccessModule } from '@africahr/inventory-data-access';
import { InventoryUnitService } from './inventory-unit.service';
import { InventoryUnitConversionService } from './inventory-unit-conversion.service';
import { InventoryCategoryService } from './inventory-category.service';
import { InventoryProductService } from './inventory-product.service';
import { InventoryWarehouseService } from './inventory-warehouse.service';
import { InventoryStockService } from './inventory-stock.service';
import { InventoryVendorService } from './inventory-vendor.service';
import { InventoryRequisitionService } from './inventory-requisition.service';
import { InventoryPurchaseOrderService } from './inventory-purchase-order.service';
import { InventoryStockRequestService } from './inventory-stock-request.service';
import { CompanyAssetService } from './company-asset.service';
import { InventoryUnitController } from './inventory-unit.controller';
import { InventoryUnitConversionController } from './inventory-unit-conversion.controller';
import { InventoryCategoryController } from './inventory-category.controller';
import { InventoryProductController } from './inventory-product.controller';
import { InventoryWarehouseController } from './inventory-warehouse.controller';
import { InventoryStockController } from './inventory-stock.controller';
import { InventoryVendorController } from './inventory-vendor.controller';
import { InventoryRequisitionController } from './inventory-requisition.controller';
import { InventoryPurchaseOrderController } from './inventory-purchase-order.controller';
import { MyStockRequestController } from './my-stock-request.controller';
import { InventoryStockRequestController } from './inventory-stock-request.controller';
import { MyCompanyAssetController } from './my-company-asset.controller';
import { CompanyAssetController } from './company-asset.controller';

@Module({
  imports: [PlatformAuthModule, InventoryDataAccessModule],
  controllers: [
    InventoryUnitController,
    InventoryUnitConversionController,
    InventoryCategoryController,
    InventoryProductController,
    InventoryWarehouseController,
    InventoryStockController,
    InventoryVendorController,
    InventoryRequisitionController,
    InventoryPurchaseOrderController,
    // "/me" self-service controllers registered before their ":id"-bearing
    // admin counterparts so the literal "me" path segment matches first.
    MyStockRequestController,
    InventoryStockRequestController,
    MyCompanyAssetController,
    CompanyAssetController,
  ],
  providers: [
    InventoryUnitService,
    InventoryUnitConversionService,
    InventoryCategoryService,
    InventoryProductService,
    InventoryWarehouseService,
    InventoryStockService,
    InventoryVendorService,
    InventoryRequisitionService,
    InventoryPurchaseOrderService,
    InventoryStockRequestService,
    CompanyAssetService,
  ],
  exports: [
    InventoryUnitService,
    InventoryUnitConversionService,
    InventoryCategoryService,
    InventoryProductService,
    InventoryWarehouseService,
    InventoryStockService,
    InventoryVendorService,
    InventoryRequisitionService,
    InventoryPurchaseOrderService,
    InventoryStockRequestService,
    CompanyAssetService,
  ],
})
export class InventoryFeatureModule {}
