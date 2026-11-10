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
