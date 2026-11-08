'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import type { CreateVendorInput, UpdateVendorInput } from './types';

// Mutations invalidate by this shorter prefix (not the full key with
// organizationId appended) so react-query's prefix matching catches every
// filtered variant cached for this tenant, not just an exact match.
function vendorsListKey(tenantId: string) {
  return ['vendors', tenantId] as const;
}

function vendorsKey(tenantId: string, organizationId?: string) {
  return [...vendorsListKey(tenantId), organizationId] as const;
}

export function useVendors(tenantId: string, organizationId?: string) {
  return useQuery({
    queryKey: vendorsKey(tenantId, organizationId),
    queryFn: async () => {
      const { data, error } = await apiClient.GET('/api/tenants/{tenantId}/vendors', {
        params: { path: { tenantId }, query: organizationId ? { organizationId } : undefined },
      });
      if (error) throw error;
      return data;
    },
  });
}

export function useCreateVendor(tenantId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: CreateVendorInput) => {
      const { data, error } = await apiClient.POST('/api/tenants/{tenantId}/vendors', {
        params: { path: { tenantId } },
        body: input,
      });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: vendorsListKey(tenantId) });
    },
  });
}

export function useUpdateVendor(tenantId: string, id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: UpdateVendorInput) => {
      const { data, error } = await apiClient.PATCH('/api/tenants/{tenantId}/vendors/{id}', {
        params: { path: { tenantId, id } },
        body: input,
      });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: vendorsListKey(tenantId) });
    },
  });
}

export function useDeleteVendor(tenantId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await apiClient.DELETE('/api/tenants/{tenantId}/vendors/{id}', {
        params: { path: { tenantId, id } },
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: vendorsListKey(tenantId) });
    },
  });
}
