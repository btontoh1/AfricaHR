'use client';

import { useMutation } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';

export function useSendPlatformBroadcast() {
  return useMutation({
    mutationFn: async (input: { subject: string; body: string }) => {
      const { data, error } = await apiClient.POST('/api/platform-admin/notifications/broadcast', {
        body: input,
      });
      if (error) throw error;
      return data;
    },
  });
}
