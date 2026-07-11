'use client';

import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';

export function useHeadcountReport(
  tenantId: string,
  filters: { organizationId?: string; from?: string; to?: string } = {},
) {
  return useQuery({
    queryKey: ['reports', 'headcount', tenantId, filters.organizationId ?? '', filters.from ?? '', filters.to ?? ''],
    queryFn: async () => {
      const { data, error } = await apiClient.GET('/api/tenants/{tenantId}/reports/headcount', {
        params: { path: { tenantId }, query: filters },
      });
      if (error) throw error;
      return data;
    },
  });
}

export function usePayrollCostReport(
  tenantId: string,
  filters: { organizationId?: string; from: string; to: string },
) {
  return useQuery({
    queryKey: ['reports', 'payroll-cost', tenantId, filters.organizationId ?? '', filters.from, filters.to],
    queryFn: async () => {
      const { data, error } = await apiClient.GET('/api/tenants/{tenantId}/reports/payroll-cost', {
        params: { path: { tenantId }, query: filters },
      });
      if (error) throw error;
      return data;
    },
    enabled: Boolean(filters.from && filters.to),
  });
}

export function useLeaveUtilizationReport(
  tenantId: string,
  filters: { organizationId?: string; leaveTypeId?: string; year?: string } = {},
) {
  return useQuery({
    queryKey: [
      'reports',
      'leave-utilization',
      tenantId,
      filters.organizationId ?? '',
      filters.leaveTypeId ?? '',
      filters.year ?? '',
    ],
    queryFn: async () => {
      const { data, error } = await apiClient.GET(
        '/api/tenants/{tenantId}/reports/leave-utilization',
        { params: { path: { tenantId }, query: filters } },
      );
      if (error) throw error;
      return data;
    },
  });
}

export function useAttendanceReport(
  tenantId: string,
  filters: { organizationId?: string; from: string; to: string },
) {
  return useQuery({
    queryKey: ['reports', 'attendance', tenantId, filters.organizationId ?? '', filters.from, filters.to],
    queryFn: async () => {
      const { data, error } = await apiClient.GET('/api/tenants/{tenantId}/reports/attendance', {
        params: { path: { tenantId }, query: filters },
      });
      if (error) throw error;
      return data;
    },
    enabled: Boolean(filters.from && filters.to),
  });
}

export function useRecruitmentPipelineReport(
  tenantId: string,
  filters: { organizationId?: string } = {},
) {
  return useQuery({
    queryKey: ['reports', 'recruitment-pipeline', tenantId, filters.organizationId ?? ''],
    queryFn: async () => {
      const { data, error } = await apiClient.GET(
        '/api/tenants/{tenantId}/reports/recruitment-pipeline',
        { params: { path: { tenantId }, query: filters } },
      );
      if (error) throw error;
      return data;
    },
  });
}
