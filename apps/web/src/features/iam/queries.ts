'use client';

import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';

export function useUsers() {
  return useQuery({
    queryKey: ['users'] as const,
    queryFn: async () => {
      const { data, error } = await apiClient.GET('/api/users');
      if (error) throw error;
      return data;
    },
  });
}
