'use client';

import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';

export interface AuditLogFilters {
  tenantId?: string;
  action?: string;
  resourceType?: string;
  from?: string;
  to?: string;
  limit?: number;
  offset?: number;
}

export function useAuditLogs(filters: AuditLogFilters) {
  return useQuery({
    queryKey: ['platform-audit-logs', filters] as const,
    queryFn: async () => {
      const { data, error } = await apiClient.GET('/api/platform-admin/audit-logs', {
        params: {
          query: {
            tenantId: filters.tenantId,
            action: filters.action,
            resourceType: filters.resourceType,
            from: filters.from,
            to: filters.to,
            limit: filters.limit?.toString(),
            offset: filters.offset?.toString(),
          },
        },
      });
      if (error) throw error;
      return data;
    },
  });
}
