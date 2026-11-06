'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';

function demoRequestsKey() {
  return ['platform-demo-requests'] as const;
}

export function useDemoRequests(options: { refetchInterval?: number } = {}) {
  return useQuery({
    queryKey: demoRequestsKey(),
    queryFn: async () => {
      const { data, error } = await apiClient.GET('/api/platform-admin/demo-requests');
      if (error) throw error;
      return data;
    },
    refetchInterval: options.refetchInterval,
  });
}

export function useMarkAllDemoRequestsViewed() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      const { error } = await apiClient.POST('/api/platform-admin/demo-requests/mark-all-viewed');
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: demoRequestsKey() });
    },
  });
}
