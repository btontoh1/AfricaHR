'use client';

import { useMutation } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import type { SubmitPublicApplicationInput } from './types';

/** No cache invalidation — a public, one-shot form with no list view behind it. */
export function useSubmitPublicApplication(requisitionId: string) {
  return useMutation({
    mutationFn: async (input: SubmitPublicApplicationInput) => {
      const { data, error } = await apiClient.POST('/api/public/job-requisitions/{id}/apply', {
        params: { path: { id: requisitionId } },
        body: input,
      });
      if (error) throw error;
      return data;
    },
  });
}
