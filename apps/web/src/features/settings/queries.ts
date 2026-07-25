'use client';

import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';

export function useMyTenant() {
  return useQuery({
    queryKey: ['my-tenant'] as const,
    queryFn: async () => {
      const { data, error } = await apiClient.GET('/api/tenants/me');
      if (error) throw error;
      return data;
    },
  });
}
