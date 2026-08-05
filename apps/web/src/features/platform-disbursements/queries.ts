'use client';

import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';

export function useDisbursementsNeedingAttention() {
  return useQuery({
    queryKey: ['platform-disbursements-needing-attention'] as const,
    queryFn: async () => {
      const { data, error } = await apiClient.GET('/api/platform-admin/disbursements');
      if (error) throw error;
      return data;
    },
  });
}
