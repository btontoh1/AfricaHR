'use client';

import { useMutation, useQueries, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import type {
  CreateOrganizationInput,
  CreateOrganizationUnitInput,
  RequestVerificationDocumentUploadInput,
  UpdateOrganizationInput,
} from './types';

function organizationsKey(tenantId: string) {
  return ['organizations', tenantId] as const;
}

function organizationKey(tenantId: string, id: string) {
  return ['organizations', tenantId, id] as const;
}

function organizationUnitsKey(tenantId: string, organizationId: string) {
  return ['organization-units', tenantId, organizationId] as const;
}

function verificationDocumentsKey(tenantId: string, organizationId: string) {
  return ['organization-verification-documents', tenantId, organizationId] as const;
}

export function useOrganizations(tenantId: string) {
  return useQuery({
    queryKey: organizationsKey(tenantId),
    queryFn: async () => {
      const { data, error } = await apiClient.GET('/api/tenants/{tenantId}/organizations', {
        params: { path: { tenantId } },
      });
      if (error) throw error;
      return data;
    },
  });
}

export function useOrganization(tenantId: string, id: string) {
  return useQuery({
    queryKey: organizationKey(tenantId, id),
    queryFn: async () => {
      const { data, error } = await apiClient.GET('/api/tenants/{tenantId}/organizations/{id}', {
        params: { path: { tenantId, id } },
      });
      if (error) throw error;
      return data;
    },
    enabled: Boolean(id),
  });
}

export function useCreateOrganization(tenantId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: CreateOrganizationInput) => {
      const { data, error } = await apiClient.POST('/api/tenants/{tenantId}/organizations', {
        params: { path: { tenantId } },
        body: input,
      });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: organizationsKey(tenantId) });
    },
  });
}

export function useUpdateOrganization(tenantId: string, id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: UpdateOrganizationInput) => {
      const { data, error } = await apiClient.PATCH('/api/tenants/{tenantId}/organizations/{id}', {
        params: { path: { tenantId, id } },
        body: input,
      });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: organizationKey(tenantId, id) });
      queryClient.invalidateQueries({ queryKey: organizationsKey(tenantId) });
    },
  });
}

// The `/organization-units` endpoint requires a single organizationId (no
// tenant-wide "all units" query) — this factory is shared by the
// single-organization hook below and by useAllOrganizationUnits, which fans
// out one query per organization to resolve unit names tenant-wide.
function organizationUnitsQueryOptions(tenantId: string, organizationId: string) {
  return {
    queryKey: organizationUnitsKey(tenantId, organizationId),
    queryFn: async () => {
      const { data, error } = await apiClient.GET('/api/tenants/{tenantId}/organization-units', {
        params: { path: { tenantId }, query: { organizationId } },
      });
      if (error) throw error;
      return data;
    },
    enabled: Boolean(organizationId),
  };
}

export function useOrganizationUnits(tenantId: string, organizationId: string) {
  return useQuery(organizationUnitsQueryOptions(tenantId, organizationId));
}

/** Resolves organization unit names across every organization in the tenant — for reports that aren't scoped to a single organization. */
export function useAllOrganizationUnits(tenantId: string, organizationIds: string[]) {
  return useQueries({
    queries: organizationIds.map((organizationId) =>
      organizationUnitsQueryOptions(tenantId, organizationId),
    ),
    combine: (results) => ({
      data: results.flatMap((result) => result.data ?? []),
      isLoading: results.some((result) => result.isLoading),
    }),
  });
}

export function useCreateOrganizationUnit(tenantId: string, organizationId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: CreateOrganizationUnitInput) => {
      const { data, error } = await apiClient.POST('/api/tenants/{tenantId}/organization-units', {
        params: { path: { tenantId } },
        body: input,
      });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: organizationUnitsKey(tenantId, organizationId) });
    },
  });
}

// --- Legal-entity verification (tenant side: submit + upload evidence) ---

export function useSubmitForVerification(tenantId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { data, error } = await apiClient.POST(
        '/api/tenants/{tenantId}/organizations/{id}/submit-verification',
        { params: { path: { tenantId, id } } },
      );
      if (error) throw error;
      return data;
    },
    onSuccess: (_data, id) => {
      queryClient.invalidateQueries({ queryKey: organizationKey(tenantId, id) });
      queryClient.invalidateQueries({ queryKey: organizationsKey(tenantId) });
    },
  });
}

export function useVerificationDocuments(tenantId: string, organizationId: string) {
  return useQuery({
    queryKey: verificationDocumentsKey(tenantId, organizationId),
    queryFn: async () => {
      const { data, error } = await apiClient.GET(
        '/api/tenants/{tenantId}/organizations/{id}/verification-documents',
        { params: { path: { tenantId, id: organizationId } } },
      );
      if (error) throw error;
      return data;
    },
    enabled: Boolean(organizationId),
  });
}

/**
 * Two steps, not one: (1) ask the API for a signed upload URL (a
 * documentId is minted at the same time), then (2) the caller PUTs the
 * raw file bytes straight to that URL - never through this app's own
 * /api/* proxy, which reads every body as text and would corrupt binary
 * data (see libs/platform/storage's own doc comment on the backend).
 */
export function useRequestDocumentUpload(tenantId: string, organizationId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: RequestVerificationDocumentUploadInput) => {
      const { data, error } = await apiClient.POST(
        '/api/tenants/{tenantId}/organizations/{id}/verification-documents/upload-url',
        { params: { path: { tenantId, id: organizationId } }, body: input },
      );
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: verificationDocumentsKey(tenantId, organizationId) });
    },
  });
}
