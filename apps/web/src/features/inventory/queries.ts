'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import type {
  CreateInventoryCategoryInput,
  CreateInventoryProductInput,
  CreateInventoryUnitConversionInput,
  CreateInventoryUnitInput,
  CreateInventoryWarehouseInput,
  IssueGoodsInput,
  ReceiveGoodsInput,
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

function invalidateStock(queryClient: ReturnType<typeof useQueryClient>, tenantId: string) {
  queryClient.invalidateQueries({ queryKey: stockBalancesListKey(tenantId) });
  queryClient.invalidateQueries({ queryKey: stockLedgerListKey(tenantId) });
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
