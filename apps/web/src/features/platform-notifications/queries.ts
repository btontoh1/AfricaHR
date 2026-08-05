'use client';

import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';

export function useNotificationDeliverySummary() {
  return useQuery({
    queryKey: ['platform-notification-delivery-summary'] as const,
    queryFn: async () => {
      const { data, error } = await apiClient.GET('/api/platform-admin/notifications');
      if (error) throw error;
      return data;
    },
  });
}
