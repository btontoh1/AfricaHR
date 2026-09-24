'use client';

import { useMutation, useQueries, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import type {
  CreateGlAccountInput,
  CreateManualJournalEntryInput,
  SetPeriodCloseInput,
  UpdateGlAccountInput,
} from './types';

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

export function useCreateAccount(tenantId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: CreateGlAccountInput) => {
      const { data, error } = await apiClient.POST('/api/tenants/{tenantId}/finance/accounts', {
        params: { path: { tenantId } },
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

function periodCloseQueryOptions(tenantId: string, organizationId: string) {
  return {
    queryKey: ['finance', 'period-close', tenantId, organizationId],
    queryFn: async () => {
      const { data, error } = await apiClient.GET('/api/tenants/{tenantId}/finance/period-close', {
        params: { path: { tenantId }, query: { organizationId } },
      });
      if (error) throw error;
      return data;
    },
    enabled: Boolean(organizationId),
  };
}

export function usePeriodClose(tenantId: string, organizationId: string) {
  return useQuery(periodCloseQueryOptions(tenantId, organizationId));
}

/** Resolves every organization's period-close status in one screen - same fan-out pattern as useAllOrganizationUnits. */
export function usePeriodCloses(tenantId: string, organizationIds: string[]) {
  return useQueries({
    queries: organizationIds.map((organizationId) => periodCloseQueryOptions(tenantId, organizationId)),
    combine: (results) => ({
      data: results.map((result) => result.data),
      isLoading: results.some((result) => result.isLoading),
    }),
  });
}

export function useSetPeriodClose(tenantId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: SetPeriodCloseInput) => {
      const { data, error } = await apiClient.POST('/api/tenants/{tenantId}/finance/period-close', {
        params: { path: { tenantId } },
        body: input,
      });
      if (error) throw error;
      return data;
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({
        queryKey: ['finance', 'period-close', tenantId, result.organizationId],
      });
    },
  });
}

/** Same-origin, proxied through /api/* like every other request - the
 * browser includes auth cookies automatically for a plain navigation/anchor
 * click, no fetch() or bearer token handling needed here. Same convention
 * as invoices' getInvoicePdfUrl. organizationId is required - a report PDF
 * is always one organization's own letterhead, never "all organizations". */
export function getProfitAndLossPdfUrl(
  tenantId: string,
  filters: { organizationId: string; from: string; to: string },
  download: boolean,
): string {
  const params = new URLSearchParams({ organizationId: filters.organizationId, from: filters.from, to: filters.to });
  if (download) params.set('download', 'true');
  return `/api/tenants/${tenantId}/finance/reports/profit-and-loss/pdf?${params.toString()}`;
}

export function getCashFlowPdfUrl(
  tenantId: string,
  filters: { organizationId: string; from: string; to: string },
  download: boolean,
): string {
  const params = new URLSearchParams({ organizationId: filters.organizationId, from: filters.from, to: filters.to });
  if (download) params.set('download', 'true');
  return `/api/tenants/${tenantId}/finance/reports/cash-flow/pdf?${params.toString()}`;
}

export function getBalanceSheetPdfUrl(
  tenantId: string,
  filters: { organizationId: string; asOf: string },
  download: boolean,
): string {
  const params = new URLSearchParams({ organizationId: filters.organizationId, asOf: filters.asOf });
  if (download) params.set('download', 'true');
  return `/api/tenants/${tenantId}/finance/reports/balance-sheet/pdf?${params.toString()}`;
}
