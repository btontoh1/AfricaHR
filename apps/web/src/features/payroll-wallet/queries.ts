'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import type { RequestWalletTopUpInput } from './types';

function walletBalancesKey(tenantId: string) {
  return ['payroll-wallet', tenantId, 'balances'] as const;
}

function walletTopUpsKey(tenantId: string) {
  return ['payroll-wallet', tenantId, 'top-ups'] as const;
}

export function useWalletBalances(tenantId: string) {
  return useQuery({
    queryKey: walletBalancesKey(tenantId),
    queryFn: async () => {
      const { data, error } = await apiClient.GET('/api/tenants/{tenantId}/payroll-wallet/balances', {
        params: { path: { tenantId } },
      });
      if (error) throw error;
      return data;
    },
    enabled: Boolean(tenantId),
  });
}

export function useWalletTopUps(tenantId: string) {
  return useQuery({
    queryKey: walletTopUpsKey(tenantId),
    queryFn: async () => {
      const { data, error } = await apiClient.GET('/api/tenants/{tenantId}/payroll-wallet/top-ups', {
        params: { path: { tenantId } },
      });
      if (error) throw error;
      return data;
    },
    enabled: Boolean(tenantId),
  });
}

export function useRequestWalletTopUp(tenantId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: RequestWalletTopUpInput) => {
      const { data, error } = await apiClient.POST('/api/tenants/{tenantId}/payroll-wallet/top-ups', {
        params: { path: { tenantId } },
        body: input,
      });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      // A freshly requested top-up is PENDING until Paystack's webhook
      // credits it (see InvoiceService.handlePaystackWebhook) - balances
      // don't change yet, but the top-up list does.
      queryClient.invalidateQueries({ queryKey: walletTopUpsKey(tenantId) });
    },
  });
}
