'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import type {
  ApproveRequisitionInput,
  AssignAssetInput,
  ConvertRequisitionToPoInput,
  CreateCompanyAssetInput,
  CreateInventoryCategoryInput,
  CreateInventoryProductInput,
  CreateInventoryUnitConversionInput,
  CreateInventoryUnitInput,
  CreateInventoryWarehouseInput,
  CompanyAssetStatus,
  CreatePurchaseOrderInput,
  CreatePurchaseRequisitionInput,
  CreateStockRequestInput,
  IssueGoodsInput,
  PurchaseOrderStatus,
  PurchaseRequisitionStatus,
  ReceiveGoodsInput,
  RejectRequisitionInput,
  RejectStockRequestInput,
  ReturnAssetInput,
  StockRequestStatus,
  TransferStockInput,
  UpdateInventoryCategoryInput,
  UpdateInventoryProductInput,
  UpdateInventoryUnitInput,
  UpdateInventoryWarehouseInput,
} from './types';

function unitsListKey(tenantId: string) {
  return ['inventory', 'units', tenantId] as const;
}

export function useInventoryUnits(tenantId: string) {
  return useQuery({
    queryKey: unitsListKey(tenantId),
    queryFn: async () => {
      const { data, error } = await apiClient.GET('/api/tenants/{tenantId}/inventory/units', {
        params: { path: { tenantId } },
      });
      if (error) throw error;
      return data;
    },
  });
}

export function useCreateInventoryUnit(tenantId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: CreateInventoryUnitInput) => {
      const { data, error } = await apiClient.POST('/api/tenants/{tenantId}/inventory/units', {
        params: { path: { tenantId } },
        body: input,
      });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: unitsListKey(tenantId) });
    },
  });
}

export function useUpdateInventoryUnit(tenantId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...input }: UpdateInventoryUnitInput & { id: string }) => {
      const { data, error } = await apiClient.PATCH('/api/tenants/{tenantId}/inventory/units/{id}', {
        params: { path: { tenantId, id } },
        body: input,
      });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: unitsListKey(tenantId) });
    },
  });
}

export function useDeleteInventoryUnit(tenantId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await apiClient.DELETE('/api/tenants/{tenantId}/inventory/units/{id}', {
        params: { path: { tenantId, id } },
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: unitsListKey(tenantId) });
    },
  });
}

function unitConversionsListKey(tenantId: string) {
  return ['inventory', 'unit-conversions', tenantId] as const;
}

export function useInventoryUnitConversions(tenantId: string) {
  return useQuery({
    queryKey: unitConversionsListKey(tenantId),
    queryFn: async () => {
      const { data, error } = await apiClient.GET('/api/tenants/{tenantId}/inventory/unit-conversions', {
        params: { path: { tenantId } },
      });
      if (error) throw error;
      return data;
    },
  });
}

export function useCreateInventoryUnitConversion(tenantId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: CreateInventoryUnitConversionInput) => {
      const { data, error } = await apiClient.POST('/api/tenants/{tenantId}/inventory/unit-conversions', {
        params: { path: { tenantId } },
        body: input,
      });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: unitConversionsListKey(tenantId) });
    },
  });
}

export function useDeleteInventoryUnitConversion(tenantId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await apiClient.DELETE('/api/tenants/{tenantId}/inventory/unit-conversions/{id}', {
        params: { path: { tenantId, id } },
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: unitConversionsListKey(tenantId) });
    },
  });
}

function categoriesListKey(tenantId: string) {
  return ['inventory', 'categories', tenantId] as const;
}

export function useInventoryCategories(tenantId: string) {
  return useQuery({
    queryKey: categoriesListKey(tenantId),
    queryFn: async () => {
      const { data, error } = await apiClient.GET('/api/tenants/{tenantId}/inventory/categories', {
        params: { path: { tenantId } },
      });
      if (error) throw error;
      return data;
    },
  });
}

export function useCreateInventoryCategory(tenantId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: CreateInventoryCategoryInput) => {
      const { data, error } = await apiClient.POST('/api/tenants/{tenantId}/inventory/categories', {
        params: { path: { tenantId } },
        body: input,
      });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: categoriesListKey(tenantId) });
    },
  });
}

export function useUpdateInventoryCategory(tenantId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...input }: UpdateInventoryCategoryInput & { id: string }) => {
      const { data, error } = await apiClient.PATCH('/api/tenants/{tenantId}/inventory/categories/{id}', {
        params: { path: { tenantId, id } },
        body: input,
      });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: categoriesListKey(tenantId) });
    },
  });
}

export function useDeleteInventoryCategory(tenantId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await apiClient.DELETE('/api/tenants/{tenantId}/inventory/categories/{id}', {
        params: { path: { tenantId, id } },
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: categoriesListKey(tenantId) });
    },
  });
}

function productsListKey(tenantId: string) {
  return ['inventory', 'products', tenantId] as const;
}

export function useInventoryProducts(tenantId: string, categoryId?: string) {
  return useQuery({
    queryKey: [...productsListKey(tenantId), categoryId ?? ''],
    queryFn: async () => {
      const { data, error } = await apiClient.GET('/api/tenants/{tenantId}/inventory/products', {
        params: { path: { tenantId }, query: categoryId ? { categoryId } : undefined },
      });
      if (error) throw error;
      return data;
    },
  });
}

export function useCreateInventoryProduct(tenantId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: CreateInventoryProductInput) => {
      const { data, error } = await apiClient.POST('/api/tenants/{tenantId}/inventory/products', {
        params: { path: { tenantId } },
        body: input,
      });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: productsListKey(tenantId) });
    },
  });
}

export function useUpdateInventoryProduct(tenantId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...input }: UpdateInventoryProductInput & { id: string }) => {
      const { data, error } = await apiClient.PATCH('/api/tenants/{tenantId}/inventory/products/{id}', {
        params: { path: { tenantId, id } },
        body: input,
      });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: productsListKey(tenantId) });
    },
  });
}

export function useDeleteInventoryProduct(tenantId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await apiClient.DELETE('/api/tenants/{tenantId}/inventory/products/{id}', {
        params: { path: { tenantId, id } },
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: productsListKey(tenantId) });
    },
  });
}

function warehousesListKey(tenantId: string) {
  return ['inventory', 'warehouses', tenantId] as const;
}

export function useInventoryWarehouses(tenantId: string, organizationId?: string) {
  return useQuery({
    queryKey: [...warehousesListKey(tenantId), organizationId ?? ''],
    queryFn: async () => {
      const { data, error } = await apiClient.GET('/api/tenants/{tenantId}/inventory/warehouses', {
        params: { path: { tenantId }, query: organizationId ? { organizationId } : undefined },
      });
      if (error) throw error;
      return data;
    },
  });
}

export function useCreateInventoryWarehouse(tenantId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: CreateInventoryWarehouseInput) => {
      const { data, error } = await apiClient.POST('/api/tenants/{tenantId}/inventory/warehouses', {
        params: { path: { tenantId } },
        body: input,
      });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: warehousesListKey(tenantId) });
    },
  });
}

export function useUpdateInventoryWarehouse(tenantId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...input }: UpdateInventoryWarehouseInput & { id: string }) => {
      const { data, error } = await apiClient.PATCH('/api/tenants/{tenantId}/inventory/warehouses/{id}', {
        params: { path: { tenantId, id } },
        body: input,
      });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: warehousesListKey(tenantId) });
    },
  });
}

export function useDeleteInventoryWarehouse(tenantId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await apiClient.DELETE('/api/tenants/{tenantId}/inventory/warehouses/{id}', {
        params: { path: { tenantId, id } },
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: warehousesListKey(tenantId) });
    },
  });
}

function stockBalancesListKey(tenantId: string) {
  return ['inventory', 'stock-balances', tenantId] as const;
}

function stockLedgerListKey(tenantId: string) {
  return ['inventory', 'stock-ledger', tenantId] as const;
}

function stockBatchesListKey(tenantId: string) {
  return ['inventory', 'stock-batches', tenantId] as const;
}

export function useStockBalances(tenantId: string, warehouseId?: string) {
  return useQuery({
    queryKey: [...stockBalancesListKey(tenantId), warehouseId ?? ''],
    queryFn: async () => {
      const { data, error } = await apiClient.GET('/api/tenants/{tenantId}/inventory/stock/balances', {
        params: { path: { tenantId }, query: warehouseId ? { warehouseId } : undefined },
      });
      if (error) throw error;
      return data;
    },
  });
}

export function useStockLedger(tenantId: string, filters: { warehouseId?: string; productId?: string }) {
  return useQuery({
    queryKey: [...stockLedgerListKey(tenantId), filters.warehouseId ?? '', filters.productId ?? ''],
    queryFn: async () => {
      const { data, error } = await apiClient.GET('/api/tenants/{tenantId}/inventory/stock/ledger', {
        params: { path: { tenantId }, query: filters },
      });
      if (error) throw error;
      return data;
    },
  });
}

export function useStockBatches(tenantId: string, filters: { productId?: string; warehouseId?: string } = {}) {
  return useQuery({
    queryKey: [...stockBatchesListKey(tenantId), filters.productId ?? '', filters.warehouseId ?? ''],
    queryFn: async () => {
      const { data, error } = await apiClient.GET('/api/tenants/{tenantId}/inventory/stock/batches', {
        params: { path: { tenantId }, query: filters },
      });
      if (error) throw error;
      return data;
    },
  });
}

function invalidateStock(queryClient: ReturnType<typeof useQueryClient>, tenantId: string) {
  queryClient.invalidateQueries({ queryKey: stockBalancesListKey(tenantId) });
  queryClient.invalidateQueries({ queryKey: stockLedgerListKey(tenantId) });
  queryClient.invalidateQueries({ queryKey: stockBatchesListKey(tenantId) });
}

export function useReceiveGoods(tenantId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: ReceiveGoodsInput) => {
      const { data, error } = await apiClient.POST('/api/tenants/{tenantId}/inventory/stock/receive', {
        params: { path: { tenantId } },
        body: input,
      });
      if (error) throw error;
      return data;
    },
    onSuccess: () => invalidateStock(queryClient, tenantId),
  });
}

export function useIssueGoods(tenantId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: IssueGoodsInput) => {
      const { data, error } = await apiClient.POST('/api/tenants/{tenantId}/inventory/stock/issue', {
        params: { path: { tenantId } },
        body: input,
      });
      if (error) throw error;
      return data;
    },
    onSuccess: () => invalidateStock(queryClient, tenantId),
  });
}

export function useTransferStock(tenantId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: TransferStockInput) => {
      const { data, error } = await apiClient.POST('/api/tenants/{tenantId}/inventory/stock/transfer', {
        params: { path: { tenantId } },
        body: input,
      });
      if (error) throw error;
      return data;
    },
    onSuccess: () => invalidateStock(queryClient, tenantId),
  });
}

export function useReverseStockEntry(tenantId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ entryId, reason }: { entryId: string; reason: string }) => {
      const { data, error } = await apiClient.POST('/api/tenants/{tenantId}/inventory/stock/{entryId}/reverse', {
        params: { path: { tenantId, entryId } },
        body: { reason },
      });
      if (error) throw error;
      return data;
    },
    onSuccess: () => invalidateStock(queryClient, tenantId),
  });
}

function vendorsListKey(tenantId: string) {
  return ['inventory', 'vendors', tenantId] as const;
}

export function useInventoryVendors(tenantId: string, organizationId?: string) {
  return useQuery({
    queryKey: [...vendorsListKey(tenantId), organizationId ?? ''],
    queryFn: async () => {
      const { data, error } = await apiClient.GET('/api/tenants/{tenantId}/inventory/vendors', {
        params: { path: { tenantId }, query: organizationId ? { organizationId } : undefined },
      });
      if (error) throw error;
      return data;
    },
  });
}

function requisitionsListKey(tenantId: string) {
  return ['inventory', 'requisitions', tenantId] as const;
}

export function useRequisitions(
  tenantId: string,
  filters: { warehouseId?: string; status?: PurchaseRequisitionStatus } = {},
) {
  return useQuery({
    queryKey: [...requisitionsListKey(tenantId), filters.warehouseId ?? '', filters.status ?? ''],
    queryFn: async () => {
      const { data, error } = await apiClient.GET('/api/tenants/{tenantId}/inventory/procurement/requisitions', {
        params: { path: { tenantId }, query: filters },
      });
      if (error) throw error;
      return data;
    },
  });
}

export function useRequisition(tenantId: string, id: string) {
  return useQuery({
    queryKey: [...requisitionsListKey(tenantId), id],
    queryFn: async () => {
      const { data, error } = await apiClient.GET('/api/tenants/{tenantId}/inventory/procurement/requisitions/{id}', {
        params: { path: { tenantId, id } },
      });
      if (error) throw error;
      return data;
    },
    enabled: Boolean(id),
  });
}

export function useCreateRequisition(tenantId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: CreatePurchaseRequisitionInput) => {
      const { data, error } = await apiClient.POST('/api/tenants/{tenantId}/inventory/procurement/requisitions', {
        params: { path: { tenantId } },
        body: input,
      });
      if (error) throw error;
      return data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: requisitionsListKey(tenantId) }),
  });
}

export function useSubmitRequisition(tenantId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { data, error } = await apiClient.POST('/api/tenants/{tenantId}/inventory/procurement/requisitions/{id}/submit', {
        params: { path: { tenantId, id } },
      });
      if (error) throw error;
      return data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: requisitionsListKey(tenantId) }),
  });
}

export function useApproveRequisition(tenantId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, input }: { id: string; input?: ApproveRequisitionInput }) => {
      const { data, error } = await apiClient.POST('/api/tenants/{tenantId}/inventory/procurement/requisitions/{id}/approve', {
        params: { path: { tenantId, id } },
        body: input ?? {},
      });
      if (error) throw error;
      return data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: requisitionsListKey(tenantId) }),
  });
}

export function useRejectRequisition(tenantId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, input }: { id: string; input: RejectRequisitionInput }) => {
      const { data, error } = await apiClient.POST('/api/tenants/{tenantId}/inventory/procurement/requisitions/{id}/reject', {
        params: { path: { tenantId, id } },
        body: input,
      });
      if (error) throw error;
      return data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: requisitionsListKey(tenantId) }),
  });
}

export function useCancelRequisition(tenantId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { data, error } = await apiClient.POST('/api/tenants/{tenantId}/inventory/procurement/requisitions/{id}/cancel', {
        params: { path: { tenantId, id } },
      });
      if (error) throw error;
      return data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: requisitionsListKey(tenantId) }),
  });
}

export function useConvertRequisitionToPo(tenantId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, input }: { id: string; input: ConvertRequisitionToPoInput }) => {
      const { data, error } = await apiClient.POST(
        '/api/tenants/{tenantId}/inventory/procurement/requisitions/{id}/convert-to-po',
        { params: { path: { tenantId, id } }, body: input },
      );
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: requisitionsListKey(tenantId) });
      queryClient.invalidateQueries({ queryKey: purchaseOrdersListKey(tenantId) });
    },
  });
}

function purchaseOrdersListKey(tenantId: string) {
  return ['inventory', 'purchase-orders', tenantId] as const;
}

export function usePurchaseOrders(
  tenantId: string,
  filters: { warehouseId?: string; vendorId?: string; status?: PurchaseOrderStatus } = {},
) {
  return useQuery({
    queryKey: [...purchaseOrdersListKey(tenantId), filters.warehouseId ?? '', filters.vendorId ?? '', filters.status ?? ''],
    queryFn: async () => {
      const { data, error } = await apiClient.GET('/api/tenants/{tenantId}/inventory/procurement/purchase-orders', {
        params: { path: { tenantId }, query: filters },
      });
      if (error) throw error;
      return data;
    },
  });
}

export function usePurchaseOrder(tenantId: string, id: string) {
  return useQuery({
    queryKey: [...purchaseOrdersListKey(tenantId), id],
    queryFn: async () => {
      const { data, error } = await apiClient.GET('/api/tenants/{tenantId}/inventory/procurement/purchase-orders/{id}', {
        params: { path: { tenantId, id } },
      });
      if (error) throw error;
      return data;
    },
    enabled: Boolean(id),
  });
}

export function useCreatePurchaseOrder(tenantId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: CreatePurchaseOrderInput) => {
      const { data, error } = await apiClient.POST('/api/tenants/{tenantId}/inventory/procurement/purchase-orders', {
        params: { path: { tenantId } },
        body: input,
      });
      if (error) throw error;
      return data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: purchaseOrdersListKey(tenantId) }),
  });
}

export function useSendPurchaseOrder(tenantId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { data, error } = await apiClient.POST('/api/tenants/{tenantId}/inventory/procurement/purchase-orders/{id}/send', {
        params: { path: { tenantId, id } },
      });
      if (error) throw error;
      return data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: purchaseOrdersListKey(tenantId) }),
  });
}

export function useCancelPurchaseOrder(tenantId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { data, error } = await apiClient.POST('/api/tenants/{tenantId}/inventory/procurement/purchase-orders/{id}/cancel', {
        params: { path: { tenantId, id } },
      });
      if (error) throw error;
      return data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: purchaseOrdersListKey(tenantId) }),
  });
}

function stockRequestsListKey(tenantId: string) {
  return ['inventory', 'stock-requests', tenantId] as const;
}

function myStockRequestsListKey(tenantId: string) {
  return ['inventory', 'stock-requests', 'mine', tenantId] as const;
}

export function useStockRequests(
  tenantId: string,
  filters: { warehouseId?: string; status?: StockRequestStatus } = {},
) {
  return useQuery({
    queryKey: [...stockRequestsListKey(tenantId), filters.warehouseId ?? '', filters.status ?? ''],
    queryFn: async () => {
      const { data, error } = await apiClient.GET('/api/tenants/{tenantId}/inventory/stock-requests', {
        params: { path: { tenantId }, query: filters },
      });
      if (error) throw error;
      return data;
    },
  });
}

export function useMyStockRequests(tenantId: string) {
  return useQuery({
    queryKey: myStockRequestsListKey(tenantId),
    queryFn: async () => {
      const { data, error } = await apiClient.GET('/api/tenants/{tenantId}/inventory/stock-requests/me', {
        params: { path: { tenantId } },
      });
      if (error) throw error;
      return data;
    },
  });
}

export function useCreateMyStockRequest(tenantId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: CreateStockRequestInput) => {
      const { data, error } = await apiClient.POST('/api/tenants/{tenantId}/inventory/stock-requests/me', {
        params: { path: { tenantId } },
        body: input,
      });
      if (error) throw error;
      return data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: myStockRequestsListKey(tenantId) }),
  });
}

export function useCancelMyStockRequest(tenantId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { data, error } = await apiClient.POST('/api/tenants/{tenantId}/inventory/stock-requests/me/{id}/cancel', {
        params: { path: { tenantId, id } },
      });
      if (error) throw error;
      return data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: myStockRequestsListKey(tenantId) }),
  });
}

export function useApproveStockRequest(tenantId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { data, error } = await apiClient.POST('/api/tenants/{tenantId}/inventory/stock-requests/{id}/approve', {
        params: { path: { tenantId, id } },
      });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: stockRequestsListKey(tenantId) });
      invalidateStock(queryClient, tenantId);
    },
  });
}

export function useRejectStockRequest(tenantId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, input }: { id: string; input: RejectStockRequestInput }) => {
      const { data, error } = await apiClient.POST('/api/tenants/{tenantId}/inventory/stock-requests/{id}/reject', {
        params: { path: { tenantId, id } },
        body: input,
      });
      if (error) throw error;
      return data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: stockRequestsListKey(tenantId) }),
  });
}

function companyAssetsListKey(tenantId: string) {
  return ['inventory', 'company-assets', tenantId] as const;
}

function myCompanyAssetsListKey(tenantId: string) {
  return ['inventory', 'company-assets', 'mine', tenantId] as const;
}

export function useCompanyAssets(
  tenantId: string,
  filters: { organizationId?: string; status?: CompanyAssetStatus } = {},
) {
  return useQuery({
    queryKey: [...companyAssetsListKey(tenantId), filters.organizationId ?? '', filters.status ?? ''],
    queryFn: async () => {
      const { data, error } = await apiClient.GET('/api/tenants/{tenantId}/inventory/assets', {
        params: { path: { tenantId }, query: filters },
      });
      if (error) throw error;
      return data;
    },
  });
}

export function useMyCompanyAssets(tenantId: string) {
  return useQuery({
    queryKey: myCompanyAssetsListKey(tenantId),
    queryFn: async () => {
      const { data, error } = await apiClient.GET('/api/tenants/{tenantId}/inventory/assets/me', {
        params: { path: { tenantId } },
      });
      if (error) throw error;
      return data;
    },
  });
}

export function useCreateCompanyAsset(tenantId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: CreateCompanyAssetInput) => {
      const { data, error } = await apiClient.POST('/api/tenants/{tenantId}/inventory/assets', {
        params: { path: { tenantId } },
        body: input,
      });
      if (error) throw error;
      return data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: companyAssetsListKey(tenantId) }),
  });
}

function invalidateAssets(queryClient: ReturnType<typeof useQueryClient>, tenantId: string) {
  queryClient.invalidateQueries({ queryKey: companyAssetsListKey(tenantId) });
  queryClient.invalidateQueries({ queryKey: myCompanyAssetsListKey(tenantId) });
}

export function useAssignAsset(tenantId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, input }: { id: string; input: AssignAssetInput }) => {
      const { data, error } = await apiClient.POST('/api/tenants/{tenantId}/inventory/assets/{id}/assign', {
        params: { path: { tenantId, id } },
        body: input,
      });
      if (error) throw error;
      return data;
    },
    onSuccess: () => invalidateAssets(queryClient, tenantId),
  });
}

export function useReturnAsset(tenantId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, input }: { id: string; input?: ReturnAssetInput }) => {
      const { data, error } = await apiClient.POST('/api/tenants/{tenantId}/inventory/assets/{id}/return', {
        params: { path: { tenantId, id } },
        body: input ?? {},
      });
      if (error) throw error;
      return data;
    },
    onSuccess: () => invalidateAssets(queryClient, tenantId),
  });
}

export function useRetireAsset(tenantId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { data, error } = await apiClient.POST('/api/tenants/{tenantId}/inventory/assets/{id}/retire', {
        params: { path: { tenantId, id } },
      });
      if (error) throw error;
      return data;
    },
    onSuccess: () => invalidateAssets(queryClient, tenantId),
  });
}

export function useAssetAssignmentHistory(tenantId: string, assetId: string) {
  return useQuery({
    queryKey: [...companyAssetsListKey(tenantId), assetId, 'assignments'],
    queryFn: async () => {
      const { data, error } = await apiClient.GET('/api/tenants/{tenantId}/inventory/assets/{id}/assignments', {
        params: { path: { tenantId, id: assetId } },
      });
      if (error) throw error;
      return data;
    },
    enabled: Boolean(assetId),
  });
}
