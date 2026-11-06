'use client';

import { useMutation } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import type { SubmitDemoRequestInput } from './types';

/** No cache invalidation — a public, one-shot form with no list view behind it. */
export function useSubmitDemoRequest() {
  return useMutation({
    mutationFn: async (input: SubmitDemoRequestInput) => {
      const { data, error } = await apiClient.POST('/api/public/demo-requests', { body: input });
      if (error) throw error;
      return data;
    },
  });
}
