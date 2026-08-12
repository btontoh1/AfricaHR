'use client';

import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';

function demoRequestsKey() {
  return ['platform-demo-requests'] as const;
}

export function useDemoRequests() {
  return useQuery({
    queryKey: demoRequestsKey(),
    queryFn: async () => {
      const { data, error } = await apiClient.GET('/api/platform-admin/demo-requests');
      if (error) throw error;
      return data;
    },
  });
}
