'use client';

import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';

export function useProfitAndLossReport(
  tenantId: string,
  filters: { organizationId?: string; from: string; to: string },
) {
  return useQuery({
    queryKey: ['finance', 'profit-and-loss', tenantId, filters.organizationId ?? '', filters.from, filters.to],
    queryFn: async () => {
      const { data, error } = await apiClient.GET('/api/tenants/{tenantId}/finance/reports/profit-and-loss', {
        params: { path: { tenantId }, query: filters },
      });
      if (error) throw error;
      return data;
    },
    enabled: Boolean(filters.from && filters.to),
  });
}

export function useCashFlowReport(
  tenantId: string,
  filters: { organizationId?: string; from: string; to: string },
) {
  return useQuery({
    queryKey: ['finance', 'cash-flow', tenantId, filters.organizationId ?? '', filters.from, filters.to],
    queryFn: async () => {
      const { data, error } = await apiClient.GET('/api/tenants/{tenantId}/finance/reports/cash-flow', {
        params: { path: { tenantId }, query: filters },
      });
      if (error) throw error;
      return data;
    },
    enabled: Boolean(filters.from && filters.to),
  });
}
