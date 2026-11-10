import type { components } from '@/lib/api-types';

export type InventoryUnit = components['schemas']['InventoryUnitResponseDto'];
export type CreateInventoryUnitInput = components['schemas']['CreateInventoryUnitDto'];
export type UpdateInventoryUnitInput = components['schemas']['UpdateInventoryUnitDto'];

export type InventoryUnitConversion = components['schemas']['InventoryUnitConversionResponseDto'];
export type CreateInventoryUnitConversionInput = components['schemas']['CreateInventoryUnitConversionDto'];

export type InventoryCategory = components['schemas']['InventoryCategoryResponseDto'];
export type CreateInventoryCategoryInput = components['schemas']['CreateInventoryCategoryDto'];
export type UpdateInventoryCategoryInput = components['schemas']['UpdateInventoryCategoryDto'];

export type InventoryProduct = components['schemas']['InventoryProductResponseDto'];
export type CreateInventoryProductInput = components['schemas']['CreateInventoryProductDto'];
export type UpdateInventoryProductInput = components['schemas']['UpdateInventoryProductDto'];

export type InventoryWarehouse = components['schemas']['InventoryWarehouseResponseDto'];
export type CreateInventoryWarehouseInput = components['schemas']['CreateInventoryWarehouseDto'];
export type UpdateInventoryWarehouseInput = components['schemas']['UpdateInventoryWarehouseDto'];

export type ReceiveGoodsInput = components['schemas']['ReceiveGoodsDto'];
export type IssueGoodsInput = components['schemas']['IssueGoodsDto'];
export type TransferStockInput = components['schemas']['TransferStockDto'];
export type ReverseStockEntryInput = components['schemas']['ReverseStockEntryDto'];
export type StockLedgerEntry = components['schemas']['StockLedgerEntryResponseDto'];
export type StockBalance = components['schemas']['StockBalanceResponseDto'];
export type StockBatch = components['schemas']['StockBatchResponseDto'];

export type VendorSummary = components['schemas']['VendorSummaryResponseDto'];

export type PurchaseRequisition = components['schemas']['PurchaseRequisitionResponseDto'];
export type PurchaseRequisitionLine = components['schemas']['PurchaseRequisitionLineResponseDto'];
export type CreatePurchaseRequisitionInput = components['schemas']['CreatePurchaseRequisitionDto'];
export type ApproveRequisitionInput = components['schemas']['ApproveRequisitionDto'];
export type RejectRequisitionInput = components['schemas']['RejectRequisitionDto'];
export type ConvertRequisitionToPoInput = components['schemas']['ConvertRequisitionToPoDto'];
export type PurchaseRequisitionStatus = PurchaseRequisition['status'];

export type PurchaseOrder = components['schemas']['PurchaseOrderResponseDto'];
export type PurchaseOrderLine = components['schemas']['PurchaseOrderLineResponseDto'];
export type CreatePurchaseOrderInput = components['schemas']['CreatePurchaseOrderDto'];
export type PurchaseOrderStatus = PurchaseOrder['status'];

export type StockRequest = components['schemas']['StockRequestResponseDto'];
export type CreateStockRequestInput = components['schemas']['CreateStockRequestDto'];
export type RejectStockRequestInput = components['schemas']['RejectStockRequestDto'];
export type StockRequestStatus = StockRequest['status'];

export type CompanyAsset = components['schemas']['CompanyAssetResponseDto'];
export type CreateCompanyAssetInput = components['schemas']['CreateCompanyAssetDto'];
export type UpdateCompanyAssetInput = components['schemas']['UpdateCompanyAssetDto'];
export type CompanyAssetAssignment = components['schemas']['CompanyAssetAssignmentResponseDto'];
export type AssignAssetInput = components['schemas']['AssignAssetDto'];
export type ReturnAssetInput = components['schemas']['ReturnAssetDto'];
export type CompanyAssetStatus = CompanyAsset['status'];
export type MyCompanyAsset = components['schemas']['MyCompanyAssetResponseDto'];
