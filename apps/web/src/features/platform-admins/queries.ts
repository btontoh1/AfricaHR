'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import type { CreatePlatformAdminInput } from './types';

function platformAdminsKey() {
  return ['platform-admins'] as const;
}

export function usePlatformAdmins() {
  return useQuery({
    queryKey: platformAdminsKey(),
    queryFn: async () => {
      const { data, error } = await apiClient.GET('/api/platform-admin/admins');
      if (error) throw error;
      return data;
    },
  });
}

export function useCreatePlatformAdmin() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: CreatePlatformAdminInput) => {
      const { data, error } = await apiClient.POST('/api/platform-admin/admins', {
        body: input,
      });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: platformAdminsKey() });
    },
  });
}

export function useUpdatePlatformAdminActive() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, isActive }: { id: string; isActive: boolean }) => {
      const { data, error } = await apiClient.PATCH('/api/platform-admin/admins/{id}/active', {
        params: { path: { id } },
        body: { isActive },
      });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: platformAdminsKey() });
    },
  });
}
