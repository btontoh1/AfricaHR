'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';

// Not tenant-scoped - this is the platform-admin review queue, spanning
// every tenant (see OrganizationVerificationController, mounted at
// /organizations/verification-queue rather than under
// /tenants/{tenantId}/...).
function verificationQueueKey() {
  return ['organization-verification-queue'] as const;
}

export function useVerificationQueue() {
  return useQuery({
    queryKey: verificationQueueKey(),
    queryFn: async () => {
      const { data, error } = await apiClient.GET('/api/organizations/verification-queue');
      if (error) throw error;
      return data;
    },
  });
}

export function useVerifyOrganization() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { data, error } = await apiClient.POST('/api/organizations/verification-queue/{id}/verify', {
        params: { path: { id } },
      });
      if (error) throw error;
      return data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: verificationQueueKey() }),
  });
}

export function useRejectOrganization() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, note }: { id: string; note: string }) => {
      const { data, error } = await apiClient.POST('/api/organizations/verification-queue/{id}/reject', {
        params: { path: { id } },
        body: { note },
      });
      if (error) throw error;
      return data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: verificationQueueKey() }),
  });
}

export function useQueueDocuments(organizationId: string) {
  return useQuery({
    queryKey: ['organization-verification-queue', organizationId, 'documents'] as const,
    queryFn: async () => {
      const { data, error } = await apiClient.GET('/api/organizations/verification-queue/{id}/documents', {
        params: { path: { id: organizationId } },
      });
      if (error) throw error;
      return data;
    },
    enabled: Boolean(organizationId),
  });
}

export async function getQueueDocumentViewUrl(organizationId: string, documentId: string): Promise<string> {
  const { data, error } = await apiClient.GET(
    '/api/organizations/verification-queue/{id}/documents/{docId}/view-url',
    { params: { path: { id: organizationId, docId: documentId } } },
  );
  if (error || !data) {
    throw error ?? new Error('Failed to resolve document view URL');
  }
  return data.viewUrl;
}
