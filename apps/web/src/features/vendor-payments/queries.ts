'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import type { CreateVendorPaymentInput } from './types';

function paymentsListKey(tenantId: string) {
  return ['vendor-payments', tenantId] as const;
}

export function useVendorPayments(tenantId: string, organizationId?: string, vendorId?: string) {
  return useQuery({
    queryKey: [...paymentsListKey(tenantId), organizationId ?? '', vendorId ?? ''],
    queryFn: async () => {
      const { data, error } = await apiClient.GET('/api/tenants/{tenantId}/vendor-payments', {
        params: { path: { tenantId }, query: { organizationId, vendorId } },
      });
      if (error) throw error;
      return data;
    },
  });
}

export function useCreateVendorPayment(tenantId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: CreateVendorPaymentInput) => {
      const { data, error } = await apiClient.POST('/api/tenants/{tenantId}/vendor-payments', {
        params: { path: { tenantId } },
        body: input,
      });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: paymentsListKey(tenantId) });
      // A recorded payment changes bills' amountPaid/balanceDue/status too.
      queryClient.invalidateQueries({ queryKey: ['vendor-bills', tenantId] });
      queryClient.invalidateQueries({ queryKey: ['vendor-bill', tenantId] });
    },
  });
}
