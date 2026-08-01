'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import type { CreateTenantInput, UpdateTenantStatusInput } from './types';

function tenantsKey() {
  return ['platform-tenants'] as const;
}

function tenantKey(id: string) {
  return ['platform-tenants', id] as const;
}

export function useTenants() {
  return useQuery({
    queryKey: tenantsKey(),
    queryFn: async () => {
      const { data, error } = await apiClient.GET('/api/tenants');
      if (error) throw error;
      return data;
    },
  });
}

export function useTenant(id: string) {
  return useQuery({
    queryKey: tenantKey(id),
    queryFn: async () => {
      const { data, error } = await apiClient.GET('/api/tenants/{id}', { params: { path: { id } } });
      if (error) throw error;
      return data;
    },
    enabled: Boolean(id),
  });
}

export function useCreateTenant() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: CreateTenantInput) => {
      const { data, error } = await apiClient.POST('/api/tenants', { body: input });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: tenantsKey() });
    },
  });
}

export function useUpdateTenantStatus(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (status: UpdateTenantStatusInput['status']) => {
      const { data, error } = await apiClient.PATCH('/api/tenants/{id}/status', {
        params: { path: { id } },
        body: { status },
      });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: tenantKey(id) });
      queryClient.invalidateQueries({ queryKey: tenantsKey() });
    },
  });
}
