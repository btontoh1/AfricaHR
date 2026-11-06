'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import type { SessionUser } from '@/lib/session';
import type {
  AdminResetPasswordInput,
  SystemRole,
  UpdateUserProfileInput,
} from '@/features/iam/types';
import type {
  CreateTenantInput,
  UpdateTenantAddOnInput,
  UpdateTenantInput,
  UpdateTenantStatusInput,
} from './types';

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
      const { data, error } = await apiClient.GET('/api/tenants/{id}', {
        params: { path: { id } },
      });
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
      const { data, error } = await apiClient.POST('/api/tenants', {
        body: input,
      });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: tenantsKey() });
    },
  });
}

export function useUpdateTenant(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: UpdateTenantInput) => {
      const { data, error } = await apiClient.PATCH('/api/tenants/{id}', {
        params: { path: { id } },
        body: input,
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

export function useUpdateTenantStatus(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (status: UpdateTenantStatusInput['status']) => {
      const { data, error } = await apiClient.PATCH(
        '/api/tenants/{id}/status',
        {
          params: { path: { id } },
          body: { status },
        },
      );
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: tenantKey(id) });
      queryClient.invalidateQueries({ queryKey: tenantsKey() });
    },
  });
}

export function useUpdateTenantAddOn(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: UpdateTenantAddOnInput) => {
      const { data, error } = await apiClient.PATCH(
        '/api/tenants/{id}/add-ons',
        {
          params: { path: { id } },
          body: input,
        },
      );
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
      const { data, error } = await apiClient.GET(
        '/api/tenants/{tenantId}/users',
        {
          params: { path: { tenantId } },
        },
      );
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
      const { data, error } = await apiClient.PATCH(
        '/api/tenants/{tenantId}/users/{id}/role',
        {
          params: { path: { tenantId, id } },
          body: { role },
        },
      );
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: tenantUsersKey(tenantId) });
    },
  });
}

export function useUpdateTenantUserProfile(tenantId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      ...profile
    }: { id: string } & UpdateUserProfileInput) => {
      const { data, error } = await apiClient.PATCH(
        '/api/tenants/{tenantId}/users/{id}/profile',
        {
          params: { path: { tenantId, id } },
          body: profile,
        },
      );
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: tenantUsersKey(tenantId) });
    },
  });
}

export function useAdminResetTenantUserPassword(tenantId: string) {
  return useMutation({
    mutationFn: async ({
      id,
      ...body
    }: { id: string } & AdminResetPasswordInput) => {
      const { data, error } = await apiClient.PATCH(
        '/api/tenants/{tenantId}/users/{id}/password',
        {
          params: { path: { tenantId, id } },
          body,
        },
      );
      if (error) throw error;
      return data;
    },
  });
}

export function useUpdateTenantUserActive(tenantId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, isActive }: { id: string; isActive: boolean }) => {
      const { data, error } = await apiClient.PATCH(
        '/api/tenants/{tenantId}/users/{id}/active',
        {
          params: { path: { tenantId, id } },
          body: { isActive },
        },
      );
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: tenantUsersKey(tenantId) });
    },
  });
}

/**
 * Not a typed apiClient call like the mutations above - it hits this
 * app's own /api/auth/impersonate Route Handler (not the generic [...path]
 * proxy), because only that handler is allowed to overwrite the
 * ACCESS_TOKEN_COOKIE while leaving the admin's REFRESH_TOKEN_COOKIE
 * untouched. See that route for why.
 */
export function useImpersonateTenantUser(tenantId: string) {
  return useMutation({
    mutationFn: async ({ id, reason }: { id: string; reason: string }) => {
      const response = await fetch('/api/auth/impersonate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tenantId, userId: id, reason }),
      });
      const body = await response.json().catch(() => null);
      if (!response.ok) {
        throw body ?? new Error('Failed to start impersonation');
      }
      return body as { user: SessionUser };
    },
  });
}

export function useDeleteTenant(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      const { error } = await apiClient.DELETE('/api/tenants/{id}', {
        params: { path: { id } },
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: tenantsKey() });
      queryClient.removeQueries({ queryKey: tenantKey(id) });
    },
  });
}

export function usePlatformDashboard() {
  return useQuery({
    queryKey: ['platform-admin-dashboard'] as const,
    queryFn: async () => {
      const { data, error } = await apiClient.GET(
        '/api/platform-admin/dashboard',
      );
      if (error) throw error;
      return data;
    },
  });
}
