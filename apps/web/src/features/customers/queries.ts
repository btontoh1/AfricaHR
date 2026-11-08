'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import type { CreateCustomerInput, UpdateCustomerInput } from './types';

// Mutations invalidate by this shorter prefix (not the full key with
// organizationId appended) so react-query's prefix matching catches every
// filtered variant cached for this tenant, not just an exact match.
function customersListKey(tenantId: string) {
  return ['customers', tenantId] as const;
}

function customersKey(tenantId: string, organizationId?: string) {
  return [...customersListKey(tenantId), organizationId] as const;
}

export function useCustomers(tenantId: string, organizationId?: string) {
  return useQuery({
    queryKey: customersKey(tenantId, organizationId),
    queryFn: async () => {
      const { data, error } = await apiClient.GET('/api/tenants/{tenantId}/customers', {
        params: { path: { tenantId }, query: organizationId ? { organizationId } : undefined },
      });
      if (error) throw error;
      return data;
    },
  });
}

export function useCreateCustomer(tenantId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: CreateCustomerInput) => {
      const { data, error } = await apiClient.POST('/api/tenants/{tenantId}/customers', {
        params: { path: { tenantId } },
        body: input,
      });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: customersListKey(tenantId) });
    },
  });
}

export function useUpdateCustomer(tenantId: string, id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: UpdateCustomerInput) => {
      const { data, error } = await apiClient.PATCH('/api/tenants/{tenantId}/customers/{id}', {
        params: { path: { tenantId, id } },
        body: input,
      });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: customersListKey(tenantId) });
    },
  });
}

export function useDeleteCustomer(tenantId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await apiClient.DELETE('/api/tenants/{tenantId}/customers/{id}', {
        params: { path: { tenantId, id } },
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: customersListKey(tenantId) });
    },
  });
}
