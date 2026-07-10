'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import type { CreateOrganizationInput, CreateOrganizationUnitInput } from './types';

function organizationsKey(tenantId: string) {
  return ['organizations', tenantId] as const;
}

function organizationKey(tenantId: string, id: string) {
  return ['organizations', tenantId, id] as const;
}

function organizationUnitsKey(tenantId: string, organizationId: string) {
  return ['organization-units', tenantId, organizationId] as const;
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

export function useOrganizationUnits(tenantId: string, organizationId: string) {
  return useQuery({
    queryKey: organizationUnitsKey(tenantId, organizationId),
    queryFn: async () => {
      const { data, error } = await apiClient.GET('/api/tenants/{tenantId}/organization-units', {
        params: { path: { tenantId }, query: { organizationId } },
      });
      if (error) throw error;
      return data;
    },
    enabled: Boolean(organizationId),
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
