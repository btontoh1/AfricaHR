'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import type { CreateCustomerInvoiceInput, CustomerInvoiceStatus, UpdateCustomerInvoiceInput } from './types';

function invoicesListKey(tenantId: string) {
  return ['customer-invoices', tenantId] as const;
}

function invoicesKey(tenantId: string, organizationId?: string) {
  return [...invoicesListKey(tenantId), organizationId] as const;
}

function invoiceKey(tenantId: string, id: string) {
  return ['customer-invoice', tenantId, id] as const;
}

export function useInvoices(tenantId: string, organizationId?: string) {
  return useQuery({
    queryKey: invoicesKey(tenantId, organizationId),
    queryFn: async () => {
      const { data, error } = await apiClient.GET('/api/tenants/{tenantId}/customer-invoices', {
        params: { path: { tenantId }, query: organizationId ? { organizationId } : undefined },
      });
      if (error) throw error;
      return data;
    },
  });
}

export function useInvoice(tenantId: string, id: string) {
  return useQuery({
    queryKey: invoiceKey(tenantId, id),
    queryFn: async () => {
      const { data, error } = await apiClient.GET('/api/tenants/{tenantId}/customer-invoices/{id}', {
        params: { path: { tenantId, id } },
      });
      if (error) throw error;
      return data;
    },
    enabled: Boolean(id),
  });
}

export function useCreateInvoice(tenantId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: CreateCustomerInvoiceInput) => {
      const { data, error } = await apiClient.POST('/api/tenants/{tenantId}/customer-invoices', {
        params: { path: { tenantId } },
        body: input,
      });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: invoicesListKey(tenantId) });
    },
  });
}

export function useUpdateInvoice(tenantId: string, id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: UpdateCustomerInvoiceInput) => {
      const { data, error } = await apiClient.PATCH('/api/tenants/{tenantId}/customer-invoices/{id}', {
        params: { path: { tenantId, id } },
        body: input,
      });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: invoicesListKey(tenantId) });
      queryClient.invalidateQueries({ queryKey: invoiceKey(tenantId, id) });
    },
  });
}

export function useUpdateInvoiceStatus(tenantId: string, id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (status: CustomerInvoiceStatus) => {
      const { data, error } = await apiClient.PATCH('/api/tenants/{tenantId}/customer-invoices/{id}/status', {
        params: { path: { tenantId, id } },
        body: { status },
      });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: invoicesListKey(tenantId) });
      queryClient.invalidateQueries({ queryKey: invoiceKey(tenantId, id) });
    },
  });
}

export function useDeleteInvoice(tenantId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await apiClient.DELETE('/api/tenants/{tenantId}/customer-invoices/{id}', {
        params: { path: { tenantId, id } },
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: invoicesListKey(tenantId) });
    },
  });
}

/** Same-origin, proxied through /api/* like every other request - the
 * browser includes auth cookies automatically for a plain navigation/anchor
 * click, no fetch() or bearer token handling needed here. */
export function getInvoicePdfUrl(tenantId: string, id: string, download: boolean): string {
  return `/api/tenants/${tenantId}/customer-invoices/${id}/pdf${download ? '?download=true' : ''}`;
}
