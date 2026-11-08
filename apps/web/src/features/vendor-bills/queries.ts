'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import type { CreateVendorBillInput, VendorBillStatus, UpdateVendorBillInput } from './types';

function billsListKey(tenantId: string) {
  return ['vendor-bills', tenantId] as const;
}

function billsKey(tenantId: string, organizationId?: string) {
  return [...billsListKey(tenantId), organizationId] as const;
}

function billKey(tenantId: string, id: string) {
  return ['vendor-bill', tenantId, id] as const;
}

export function useVendorBills(tenantId: string, organizationId?: string) {
  return useQuery({
    queryKey: billsKey(tenantId, organizationId),
    queryFn: async () => {
      const { data, error } = await apiClient.GET('/api/tenants/{tenantId}/vendor-bills', {
        params: { path: { tenantId }, query: organizationId ? { organizationId } : undefined },
      });
      if (error) throw error;
      return data;
    },
  });
}

export function useVendorBill(tenantId: string, id: string) {
  return useQuery({
    queryKey: billKey(tenantId, id),
    queryFn: async () => {
      const { data, error } = await apiClient.GET('/api/tenants/{tenantId}/vendor-bills/{id}', {
        params: { path: { tenantId, id } },
      });
      if (error) throw error;
      return data;
    },
    enabled: Boolean(id),
  });
}

export function useCreateVendorBill(tenantId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: CreateVendorBillInput) => {
      const { data, error } = await apiClient.POST('/api/tenants/{tenantId}/vendor-bills', {
        params: { path: { tenantId } },
        body: input,
      });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: billsListKey(tenantId) });
    },
  });
}

export function useUpdateVendorBill(tenantId: string, id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: UpdateVendorBillInput) => {
      const { data, error } = await apiClient.PATCH('/api/tenants/{tenantId}/vendor-bills/{id}', {
        params: { path: { tenantId, id } },
        body: input,
      });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: billsListKey(tenantId) });
      queryClient.invalidateQueries({ queryKey: billKey(tenantId, id) });
    },
  });
}

export function useUpdateVendorBillStatus(tenantId: string, id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (status: VendorBillStatus) => {
      const { data, error } = await apiClient.PATCH('/api/tenants/{tenantId}/vendor-bills/{id}/status', {
        params: { path: { tenantId, id } },
        body: { status },
      });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: billsListKey(tenantId) });
      queryClient.invalidateQueries({ queryKey: billKey(tenantId, id) });
    },
  });
}

export function useDeleteVendorBill(tenantId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await apiClient.DELETE('/api/tenants/{tenantId}/vendor-bills/{id}', {
        params: { path: { tenantId, id } },
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: billsListKey(tenantId) });
    },
  });
}
