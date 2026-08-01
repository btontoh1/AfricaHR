'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import type { SystemRole } from '@/features/iam/types';
import type { CreateTenantInput, UpdateTenantStatusInput } from './types';

function tenantsKey() {
  return ['platform-tenants'] as const;
}

function tenantKey(id: string) {
  return ['platform-tenants', id] as const;
}

function tenantUsersKey(tenantId: string) {
  return ['platform-tenants', tenantId, 'users'] as const;
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

export function useTenantUsers(tenantId: string) {
  return useQuery({
    queryKey: tenantUsersKey(tenantId),
    queryFn: async () => {
      const { data, error } = await apiClient.GET('/api/tenants/{tenantId}/users', {
        params: { path: { tenantId } },
      });
      if (error) throw error;
      return data;
    },
    enabled: Boolean(tenantId),
  });
}

export function useUpdateTenantUserRole(tenantId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, role }: { id: string; role: SystemRole }) => {
      const { data, error } = await apiClient.PATCH('/api/tenants/{tenantId}/users/{id}/role', {
        params: { path: { tenantId, id } },
        body: { role },
      });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: tenantUsersKey(tenantId) });
    },
  });
}

export function useUpdateTenantUserActive(tenantId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, isActive }: { id: string; isActive: boolean }) => {
      const { data, error } = await apiClient.PATCH('/api/tenants/{tenantId}/users/{id}/active', {
        params: { path: { tenantId, id } },
        body: { isActive },
      });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: tenantUsersKey(tenantId) });
    },
  });
}

export function usePlatformDashboard() {
  return useQuery({
    queryKey: ['platform-admin-dashboard'] as const,
    queryFn: async () => {
      const { data, error } = await apiClient.GET('/api/platform-admin/dashboard');
      if (error) throw error;
      return data;
    },
  });
}
