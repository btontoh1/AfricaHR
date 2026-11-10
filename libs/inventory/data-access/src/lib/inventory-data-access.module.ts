import { Module } from '@nestjs/common';
import { PrismaModule } from '@africahr/platform-database';
import { InventoryUnitRepository } from './inventory-unit.repository';
import { InventoryUnitConversionRepository } from './inventory-unit-conversion.repository';
import { InventoryCategoryRepository } from './inventory-category.repository';
import { InventoryProductRepository } from './inventory-product.repository';
import { InventoryWarehouseRepository } from './inventory-warehouse.repository';
import { InventoryStockRepository } from './inventory-stock.repository';
import { InventoryStockBatchRepository } from './inventory-stock-batch.repository';
import { InventoryEmployeeRepository } from './inventory-employee.repository';
import { InventoryVendorRepository } from './inventory-vendor.repository';
import { InventoryPurchaseRequisitionRepository } from './inventory-purchase-requisition.repository';
import { InventoryPurchaseOrderRepository } from './inventory-purchase-order.repository';
import { InventoryStockRequestRepository } from './inventory-stock-request.repository';
import { CompanyAssetRepository } from './company-asset.repository';
import { CompanyAssetAssignmentRepository } from './company-asset-assignment.repository';

@Module({
  imports: [PrismaModule],
  providers: [
    InventoryUnitRepository,
    InventoryUnitConversionRepository,
    InventoryCategoryRepository,
    InventoryProductRepository,
    InventoryWarehouseRepository,
    InventoryStockRepository,
    InventoryStockBatchRepository,
    InventoryEmployeeRepository,
    InventoryVendorRepository,
    InventoryPurchaseRequisitionRepository,
    InventoryPurchaseOrderRepository,
    InventoryStockRequestRepository,
    CompanyAssetRepository,
    CompanyAssetAssignmentRepository,
  ],
  exports: [
    InventoryUnitRepository,
    InventoryUnitConversionRepository,
    InventoryCategoryRepository,
    InventoryProductRepository,
    InventoryWarehouseRepository,
    InventoryStockRepository,
    InventoryStockBatchRepository,
    InventoryEmployeeRepository,
    InventoryVendorRepository,
    InventoryPurchaseRequisitionRepository,
    InventoryPurchaseOrderRepository,
    InventoryStockRequestRepository,
    CompanyAssetRepository,
    CompanyAssetAssignmentRepository,
  ],
})
export class InventoryDataAccessModule {}
