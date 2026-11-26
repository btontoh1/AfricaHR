'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import type { CreatePolicyInput } from './types';

function policiesKey(tenantId: string) {
  return ['intranet-policies', tenantId] as const;
}

function myPoliciesKey(tenantId: string) {
  return ['intranet-my-policies', tenantId] as const;
}

function acknowledgementsKey(tenantId: string, policyId: string) {
  return ['intranet-policy-acknowledgements', tenantId, policyId] as const;
}

export function usePolicies(tenantId: string) {
  return useQuery({
    queryKey: policiesKey(tenantId),
    queryFn: async () => {
      const { data, error } = await apiClient.GET('/api/tenants/{tenantId}/policies', {
        params: { path: { tenantId } },
      });
      if (error) throw error;
      return data;
    },
  });
}

export function useCreatePolicy(tenantId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: CreatePolicyInput) => {
      const { data, error } = await apiClient.POST('/api/tenants/{tenantId}/policies', {
        params: { path: { tenantId } },
        body: input,
      });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: policiesKey(tenantId) });
    },
  });
}

export function usePolicyViewUrl(tenantId: string) {
  return useMutation({
    mutationFn: async (policyId: string) => {
      const { data, error } = await apiClient.GET('/api/tenants/{tenantId}/policies/{id}/view-url', {
        params: { path: { tenantId, id: policyId } },
      });
      if (error) throw error;
      return data.viewUrl;
    },
  });
}

export function usePolicyAcknowledgements(tenantId: string, policyId: string | null) {
  return useQuery({
    queryKey: acknowledgementsKey(tenantId, policyId ?? ''),
    queryFn: async () => {
      const { data, error } = await apiClient.GET('/api/tenants/{tenantId}/policies/{id}/acknowledgements', {
        params: { path: { tenantId, id: policyId as string } },
      });
      if (error) throw error;
      return data;
    },
    enabled: Boolean(policyId),
  });
}

export function useMyPolicies(tenantId: string) {
  return useQuery({
    queryKey: myPoliciesKey(tenantId),
    queryFn: async () => {
      const { data, error } = await apiClient.GET('/api/tenants/{tenantId}/policies/me', {
        params: { path: { tenantId } },
      });
      if (error) throw error;
      return data;
    },
  });
}

export function useMyPolicyViewUrl(tenantId: string) {
  return useMutation({
    mutationFn: async (policyId: string) => {
      const { data, error } = await apiClient.GET('/api/tenants/{tenantId}/policies/me/{id}/view-url', {
        params: { path: { tenantId, id: policyId } },
      });
      if (error) throw error;
      return data.viewUrl;
    },
  });
}

export function useAcknowledgePolicy(tenantId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (policyId: string) => {
      const { data, error } = await apiClient.POST('/api/tenants/{tenantId}/policies/me/{id}/acknowledge', {
        params: { path: { tenantId, id: policyId } },
      });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: myPoliciesKey(tenantId) });
    },
  });
}
