'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import type { CreateManualJournalEntryInput, UpdateGlAccountInput } from './types';

function journalEntriesListKey(tenantId: string) {
  return ['finance', 'journal-entries', tenantId] as const;
}

function accountsListKey(tenantId: string) {
  return ['finance', 'accounts', tenantId] as const;
}

export function useAccounts(tenantId: string) {
  return useQuery({
    queryKey: accountsListKey(tenantId),
    queryFn: async () => {
      const { data, error } = await apiClient.GET('/api/tenants/{tenantId}/finance/accounts', {
        params: { path: { tenantId } },
      });
      if (error) throw error;
      return data;
    },
  });
}

export function useRenameAccount(tenantId: string, id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: UpdateGlAccountInput) => {
      const { data, error } = await apiClient.PATCH('/api/tenants/{tenantId}/finance/accounts/{id}', {
        params: { path: { tenantId, id } },
        body: input,
      });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: accountsListKey(tenantId) });
    },
  });
}

export function useJournalEntries(tenantId: string, organizationId?: string) {
  return useQuery({
    queryKey: [...journalEntriesListKey(tenantId), organizationId ?? ''],
    queryFn: async () => {
      const { data, error } = await apiClient.GET('/api/tenants/{tenantId}/finance/journal-entries', {
        params: { path: { tenantId }, query: organizationId ? { organizationId } : undefined },
      });
      if (error) throw error;
      return data;
    },
  });
}

export function useCreateJournalEntry(tenantId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: CreateManualJournalEntryInput) => {
      const { data, error } = await apiClient.POST('/api/tenants/{tenantId}/finance/journal-entries', {
        params: { path: { tenantId } },
        body: input,
      });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: journalEntriesListKey(tenantId) });
    },
  });
}

export function useVoidJournalEntry(tenantId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { data, error } = await apiClient.POST('/api/tenants/{tenantId}/finance/journal-entries/{id}/void', {
        params: { path: { tenantId, id } },
      });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: journalEntriesListKey(tenantId) });
    },
  });
}

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

export function useBalanceSheetReport(
  tenantId: string,
  filters: { organizationId?: string; asOf: string },
) {
  return useQuery({
    queryKey: ['finance', 'balance-sheet', tenantId, filters.organizationId ?? '', filters.asOf],
    queryFn: async () => {
      const { data, error } = await apiClient.GET('/api/tenants/{tenantId}/finance/reports/balance-sheet', {
        params: { path: { tenantId }, query: filters },
      });
      if (error) throw error;
      return data;
    },
    enabled: Boolean(filters.asOf),
  });
}
