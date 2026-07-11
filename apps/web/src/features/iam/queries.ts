'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import type { CreateUserInput, SystemRole } from './types';

function usersKey() {
  return ['users'] as const;
}

export function useUsers() {
  return useQuery({
    queryKey: usersKey(),
    queryFn: async () => {
      const { data, error } = await apiClient.GET('/api/users');
      if (error) throw error;
      return data;
    },
  });
}

export function useCreateUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: CreateUserInput) => {
      const { data, error } = await apiClient.POST('/api/users', { body: input });
      if (error) throw error;
      return data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: usersKey() }),
  });
}

export function useUpdateUserRole(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (role: SystemRole) => {
      const { data, error } = await apiClient.PATCH('/api/users/{id}/role', {
        params: { path: { id } },
        body: { role },
      });
      if (error) throw error;
      return data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: usersKey() }),
  });
}

export function useSetUserActive(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (isActive: boolean) => {
      const { data, error } = await apiClient.PATCH('/api/users/{id}/active', {
        params: { path: { id } },
        body: { isActive },
      });
      if (error) throw error;
      return data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: usersKey() }),
  });
}
