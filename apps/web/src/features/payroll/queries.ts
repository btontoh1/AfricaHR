'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import type { CreatePayRunInput, CreatePayslipLineItemInput } from './types';

function payRunsKey(tenantId: string) {
  return ['pay-runs', tenantId] as const;
}

function payRunKey(tenantId: string, id: string) {
  return ['pay-runs', tenantId, id] as const;
}

function payslipsKey(tenantId: string, payRunId: string) {
  return ['payslips', tenantId, payRunId] as const;
}

function payslipKey(tenantId: string, id: string) {
  return ['payslips', 'detail', tenantId, id] as const;
}

function myPayslipsKey(tenantId: string) {
  return ['payslips', 'me', tenantId] as const;
}

function myPayslipKey(tenantId: string, id: string) {
  return ['payslips', 'me', tenantId, id] as const;
}

// --- Pay runs ---

export function usePayRuns(tenantId: string, organizationId?: string) {
  return useQuery({
    queryKey: [...payRunsKey(tenantId), organizationId ?? 'ALL'],
    queryFn: async () => {
      const { data, error } = await apiClient.GET('/api/tenants/{tenantId}/pay-runs', {
        params: { path: { tenantId }, query: organizationId ? { organizationId } : {} },
      });
      if (error) throw error;
      return data;
    },
  });
}

export function usePayRun(tenantId: string, id: string) {
  return useQuery({
    queryKey: payRunKey(tenantId, id),
    queryFn: async () => {
      const { data, error } = await apiClient.GET('/api/tenants/{tenantId}/pay-runs/{id}', {
        params: { path: { tenantId, id } },
      });
      if (error) throw error;
      return data;
    },
    enabled: Boolean(id),
  });
}

export function useCreatePayRun(tenantId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: CreatePayRunInput) => {
      const { data, error } = await apiClient.POST('/api/tenants/{tenantId}/pay-runs', {
        params: { path: { tenantId } },
        body: input,
      });
      if (error) throw error;
      return data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: payRunsKey(tenantId) }),
  });
}

type PayRunAction = 'process' | 'approve' | 'pay' | 'close' | 'cancel';

const ACTION_PATH: Record<PayRunAction, '/api/tenants/{tenantId}/pay-runs/{id}/process' | '/api/tenants/{tenantId}/pay-runs/{id}/approve' | '/api/tenants/{tenantId}/pay-runs/{id}/pay' | '/api/tenants/{tenantId}/pay-runs/{id}/close' | '/api/tenants/{tenantId}/pay-runs/{id}/cancel'> = {
  process: '/api/tenants/{tenantId}/pay-runs/{id}/process',
  approve: '/api/tenants/{tenantId}/pay-runs/{id}/approve',
  pay: '/api/tenants/{tenantId}/pay-runs/{id}/pay',
  close: '/api/tenants/{tenantId}/pay-runs/{id}/close',
  cancel: '/api/tenants/{tenantId}/pay-runs/{id}/cancel',
};

export function usePayRunAction(tenantId: string, id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (action: PayRunAction) => {
      const { data, error } = await apiClient.POST(ACTION_PATH[action], {
        params: { path: { tenantId, id } },
      });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: payRunsKey(tenantId) });
      queryClient.invalidateQueries({ queryKey: payRunKey(tenantId, id) });
    },
  });
}

// --- Payslips ---

export function usePayslipsByPayRun(tenantId: string, payRunId: string) {
  return useQuery({
    queryKey: payslipsKey(tenantId, payRunId),
    queryFn: async () => {
      const { data, error } = await apiClient.GET('/api/tenants/{tenantId}/payslips', {
        params: { path: { tenantId }, query: { payRunId } },
      });
      if (error) throw error;
      return data;
    },
    enabled: Boolean(payRunId),
  });
}

export function usePayslip(tenantId: string, id: string) {
  return useQuery({
    queryKey: payslipKey(tenantId, id),
    queryFn: async () => {
      const { data, error } = await apiClient.GET('/api/tenants/{tenantId}/payslips/{id}', {
        params: { path: { tenantId, id } },
      });
      if (error) throw error;
      return data;
    },
    enabled: Boolean(id),
  });
}

export function useAddPayslipLineItem(tenantId: string, payslipId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: CreatePayslipLineItemInput) => {
      const { data, error } = await apiClient.POST(
        '/api/tenants/{tenantId}/payslips/{id}/line-items',
        { params: { path: { tenantId, id: payslipId } }, body: input },
      );
      if (error) throw error;
      return data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: payslipKey(tenantId, payslipId) }),
  });
}

// --- Self-service ---

export function useMyPayslips(tenantId: string) {
  return useQuery({
    queryKey: myPayslipsKey(tenantId),
    queryFn: async () => {
      const { data, error } = await apiClient.GET('/api/tenants/{tenantId}/payslips/me', {
        params: { path: { tenantId } },
      });
      if (error) throw error;
      return data;
    },
  });
}

export function useMyPayslip(tenantId: string, id: string) {
  return useQuery({
    queryKey: myPayslipKey(tenantId, id),
    queryFn: async () => {
      const { data, error } = await apiClient.GET('/api/tenants/{tenantId}/payslips/me/{id}', {
        params: { path: { tenantId, id } },
      });
      if (error) throw error;
      return data;
    },
    enabled: Boolean(id),
  });
}

export function useRemovePayslipLineItem(tenantId: string, payslipId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (lineItemId: string) => {
      const { error } = await apiClient.DELETE(
        '/api/tenants/{tenantId}/payslips/{id}/line-items/{lineItemId}',
        { params: { path: { tenantId, id: payslipId, lineItemId } } },
      );
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: payslipKey(tenantId, payslipId) }),
  });
}
