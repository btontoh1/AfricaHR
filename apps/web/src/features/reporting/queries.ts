'use client';

import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import type { CompanyAssetStatus } from '@/features/inventory/types';

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

export function useInventoryValuationReport(tenantId: string, filters: { warehouseId?: string } = {}) {
  return useQuery({
    queryKey: ['reports', 'inventory-valuation', tenantId, filters.warehouseId ?? ''],
    queryFn: async () => {
      const { data, error } = await apiClient.GET('/api/tenants/{tenantId}/reports/inventory-valuation', {
        params: { path: { tenantId }, query: filters },
      });
      if (error) throw error;
      return data;
    },
  });
}

export function useProcurementSpendReport(
  tenantId: string,
  filters: { vendorId?: string; from?: string; to?: string } = {},
) {
  return useQuery({
    queryKey: [
      'reports',
      'procurement-spend',
      tenantId,
      filters.vendorId ?? '',
      filters.from ?? '',
      filters.to ?? '',
    ],
    queryFn: async () => {
      const { data, error } = await apiClient.GET('/api/tenants/{tenantId}/reports/procurement-spend', {
        params: { path: { tenantId }, query: filters },
      });
      if (error) throw error;
      return data;
    },
  });
}

export function useLowStockReport(tenantId: string, filters: { warehouseId?: string } = {}) {
  return useQuery({
    queryKey: ['reports', 'low-stock', tenantId, filters.warehouseId ?? ''],
    queryFn: async () => {
      const { data, error } = await apiClient.GET('/api/tenants/{tenantId}/reports/low-stock', {
        params: { path: { tenantId }, query: filters },
      });
      if (error) throw error;
      return data;
    },
  });
}

export function useAssetRegisterReport(
  tenantId: string,
  filters: { status?: CompanyAssetStatus; category?: string } = {},
) {
  return useQuery({
    queryKey: ['reports', 'asset-register', tenantId, filters.status ?? '', filters.category ?? ''],
    queryFn: async () => {
      const { data, error } = await apiClient.GET('/api/tenants/{tenantId}/reports/asset-register', {
        params: { path: { tenantId }, query: filters },
      });
      if (error) throw error;
      return data;
    },
  });
}
