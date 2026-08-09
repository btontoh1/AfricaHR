'use client';

import { useMutation } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import type {
  RequestPublicIdentityDocumentUploadInput,
  RequestPublicResumeUploadInput,
  SubmitPublicApplicationInput,
} from './types';

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

export function useRequestResumeUpload(requisitionId: string) {
  return useMutation({
    mutationFn: async (input: RequestPublicResumeUploadInput) => {
      const { data, error } = await apiClient.POST('/api/public/job-requisitions/{id}/resume-upload-url', {
        params: { path: { id: requisitionId } },
        body: input,
      });
      if (error) throw error;
      return data;
    },
  });
}

export function useRequestIdentityDocumentUpload(requisitionId: string) {
  return useMutation({
    mutationFn: async (input: RequestPublicIdentityDocumentUploadInput) => {
      const { data, error } = await apiClient.POST(
        '/api/public/job-requisitions/{id}/identity-document-upload-url',
        { params: { path: { id: requisitionId } }, body: input },
      );
      if (error) throw error;
      return data;
    },
  });
}
