'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import type { SubmitWeeklyReportInput } from './weekly-report-types';

function myWeeklyReportsKey(tenantId: string) {
  return ['intranet-my-weekly-reports', tenantId] as const;
}

function myWeeklyReportTemplateKey(tenantId: string) {
  return ['intranet-my-weekly-report-template', tenantId] as const;
}

function weeklyReportsKey(tenantId: string, organizationUnitId?: string, weekStart?: string) {
  return ['intranet-weekly-reports', tenantId, organizationUnitId ?? null, weekStart ?? null] as const;
}

function weeklyReportCommentsKey(tenantId: string, reportId: string) {
  return ['intranet-weekly-report-comments', tenantId, reportId] as const;
}

function weeklyReportTemplateKey(tenantId: string, organizationUnitId: string) {
  return ['intranet-weekly-report-template', tenantId, organizationUnitId] as const;
}

export function useMyWeeklyReportTemplate(tenantId: string) {
  return useQuery({
    queryKey: myWeeklyReportTemplateKey(tenantId),
    queryFn: async () => {
      const { data, error } = await apiClient.GET('/api/tenants/{tenantId}/weekly-reports/me/template', {
        params: { path: { tenantId } },
      });
      if (error) throw error;
      return data;
    },
  });
}

export function useMyWeeklyReports(tenantId: string) {
  return useQuery({
    queryKey: myWeeklyReportsKey(tenantId),
    queryFn: async () => {
      const { data, error } = await apiClient.GET('/api/tenants/{tenantId}/weekly-reports/me', {
        params: { path: { tenantId } },
      });
      if (error) throw error;
      return data;
    },
  });
}

export function useSubmitWeeklyReport(tenantId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: SubmitWeeklyReportInput) => {
      const { data, error } = await apiClient.POST('/api/tenants/{tenantId}/weekly-reports/me', {
        params: { path: { tenantId } },
        body: input,
      });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: myWeeklyReportsKey(tenantId) });
    },
  });
}

export function useWeeklyReports(tenantId: string, organizationUnitId?: string, weekStart?: string) {
  return useQuery({
    queryKey: weeklyReportsKey(tenantId, organizationUnitId, weekStart),
    queryFn: async () => {
      const { data, error } = await apiClient.GET('/api/tenants/{tenantId}/weekly-reports', {
        params: { path: { tenantId }, query: { organizationUnitId, weekStart } },
      });
      if (error) throw error;
      return data;
    },
  });
}

export function useWeeklyReportComments(tenantId: string, reportId: string | null) {
  return useQuery({
    queryKey: weeklyReportCommentsKey(tenantId, reportId ?? ''),
    queryFn: async () => {
      const { data, error } = await apiClient.GET('/api/tenants/{tenantId}/weekly-reports/{id}/comments', {
        params: { path: { tenantId, id: reportId as string } },
      });
      if (error) throw error;
      return data;
    },
    enabled: Boolean(reportId),
  });
}

export function useAddWeeklyReportComment(tenantId: string, reportId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (body: string) => {
      const { data, error } = await apiClient.POST('/api/tenants/{tenantId}/weekly-reports/{id}/comments', {
        params: { path: { tenantId, id: reportId } },
        body: { body },
      });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: weeklyReportCommentsKey(tenantId, reportId) });
    },
  });
}

export function useWeeklyReportTemplate(tenantId: string, organizationUnitId: string) {
  return useQuery({
    queryKey: weeklyReportTemplateKey(tenantId, organizationUnitId),
    queryFn: async () => {
      const { data, error } = await apiClient.GET('/api/tenants/{tenantId}/weekly-report-templates/{organizationUnitId}', {
        params: { path: { tenantId, organizationUnitId } },
      });
      if (error) throw error;
      return data;
    },
    enabled: Boolean(organizationUnitId),
  });
}

export function useUpsertWeeklyReportTemplate(tenantId: string, organizationUnitId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (questions: string[]) => {
      const { data, error } = await apiClient.PUT('/api/tenants/{tenantId}/weekly-report-templates/{organizationUnitId}', {
        params: { path: { tenantId, organizationUnitId } },
        body: { questions },
      });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: weeklyReportTemplateKey(tenantId, organizationUnitId) });
    },
  });
}
