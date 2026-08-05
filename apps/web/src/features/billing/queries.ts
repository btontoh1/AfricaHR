'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import type { AssignSubscriptionInput } from './types';

function subscriptionKey(tenantId: string) {
  return ['billing', tenantId, 'subscription'] as const;
}

function invoicesKey(tenantId: string) {
  return ['billing', tenantId, 'invoices'] as const;
}

function platformBillingSummaryKey() {
  return ['platform-billing-summary'] as const;
}

export function useSubscription(tenantId: string) {
  return useQuery({
    queryKey: subscriptionKey(tenantId),
    queryFn: async () => {
      const { data, error, response } = await apiClient.GET('/api/tenants/{tenantId}/subscription', {
        params: { path: { tenantId } },
      });
      // No subscription yet is a normal state for a tenant, not a query
      // failure - surfaced as null so the UI can offer to assign one
      // instead of rendering an error state.
      if (response.status === 404) {
        return null;
      }
      if (error) throw error;
      return data;
    },
    enabled: Boolean(tenantId),
  });
}

export function useAssignSubscription(tenantId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: AssignSubscriptionInput) => {
      const { data, error } = await apiClient.POST('/api/tenants/{tenantId}/subscription', {
        params: { path: { tenantId } },
        body: input,
      });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: subscriptionKey(tenantId) });
    },
  });
}

export function useCancelSubscription(tenantId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      const { data, error } = await apiClient.POST('/api/tenants/{tenantId}/subscription/cancel', {
        params: { path: { tenantId } },
      });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: subscriptionKey(tenantId) });
    },
  });
}

export function useInvoices(tenantId: string) {
  return useQuery({
    queryKey: invoicesKey(tenantId),
    queryFn: async () => {
      const { data, error } = await apiClient.GET('/api/tenants/{tenantId}/invoices', {
        params: { path: { tenantId } },
      });
      if (error) throw error;
      return data;
    },
    enabled: Boolean(tenantId),
  });
}

export function useGenerateInvoice(tenantId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      const { data, error } = await apiClient.POST('/api/tenants/{tenantId}/invoices', {
        params: { path: { tenantId } },
      });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: invoicesKey(tenantId) });
    },
  });
}

export function useMarkInvoicePaid(tenantId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { data, error } = await apiClient.PATCH('/api/tenants/{tenantId}/invoices/{id}/mark-paid', {
        params: { path: { tenantId, id } },
      });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: invoicesKey(tenantId) });
      // A paid invoice rolls the subscription's billing period forward
      // (see InvoiceService.advanceSubscriptionPeriod) - refresh it too.
      queryClient.invalidateQueries({ queryKey: subscriptionKey(tenantId) });
    },
  });
}

export function useCancelInvoice(tenantId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { data, error } = await apiClient.PATCH('/api/tenants/{tenantId}/invoices/{id}/cancel', {
        params: { path: { tenantId, id } },
      });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: invoicesKey(tenantId) });
    },
  });
}

export function usePlatformBillingSummary() {
  return useQuery({
    queryKey: platformBillingSummaryKey(),
    queryFn: async () => {
      const { data, error } = await apiClient.GET('/api/platform-admin/billing/summary');
      if (error) throw error;
      return data;
    },
  });
}
