'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import type { PerformanceFramework, RequestTenantLogoUploadInput } from './types';

export const MY_TENANT_KEY = ['my-tenant'] as const;

export function useMyTenant(options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: MY_TENANT_KEY,
    queryFn: async () => {
      const { data, error } = await apiClient.GET('/api/tenants/me');
      if (error) throw error;
      return data;
    },
    enabled: options?.enabled,
  });
}

export function useRequestLogoUpload() {
  return useMutation({
    mutationFn: async (input: RequestTenantLogoUploadInput) => {
      const { data, error } = await apiClient.POST('/api/tenants/me/logo/upload-url', { body: input });
      if (error) throw error;
      return data;
    },
  });
}

export function useUpdatePerformanceFramework() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (performanceFramework: PerformanceFramework) => {
      const { data, error } = await apiClient.PATCH('/api/tenants/me/performance-framework', {
        body: { performanceFramework },
      });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: MY_TENANT_KEY });
    },
  });
}

export function useRemoveLogo() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      const { error } = await apiClient.DELETE('/api/tenants/me/logo');
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: MY_TENANT_KEY });
    },
  });
}
