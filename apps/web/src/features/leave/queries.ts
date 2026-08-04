'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import type {
  AdjustLeaveBalanceInput,
  CreateLeaveRequestInput,
  CreateLeaveTypeInput,
  LeaveRequestStatus,
  UpdateLeaveTypeInput,
} from './types';

function leaveTypesKey(tenantId: string) {
  return ['leave-types', tenantId] as const;
}

function myLeaveRequestsKey(tenantId: string) {
  return ['leave-requests', 'me', tenantId] as const;
}

function myLeaveBalancesKey(tenantId: string) {
  return ['leave-balances', 'me', tenantId] as const;
}

function leaveRequestsKey(tenantId: string) {
  return ['leave-requests', 'all', tenantId] as const;
}

function teamLeaveRequestsKey(tenantId: string) {
  return ['leave-requests', 'team', tenantId] as const;
}

// --- Leave types (shared catalog, open read to any authenticated tenant member) ---

export function useLeaveTypes(tenantId: string) {
  return useQuery({
    queryKey: leaveTypesKey(tenantId),
    queryFn: async () => {
      const { data, error } = await apiClient.GET('/api/tenants/{tenantId}/leave-types', {
        params: { path: { tenantId } },
      });
      if (error) throw error;
      return data;
    },
  });
}

export function useCreateLeaveType(tenantId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: CreateLeaveTypeInput) => {
      const { data, error } = await apiClient.POST('/api/tenants/{tenantId}/leave-types', {
        params: { path: { tenantId } },
        body: input,
      });
      if (error) throw error;
      return data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: leaveTypesKey(tenantId) }),
  });
}

export function useUpdateLeaveType(tenantId: string, id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: UpdateLeaveTypeInput) => {
      const { data, error } = await apiClient.PATCH('/api/tenants/{tenantId}/leave-types/{id}', {
        params: { path: { tenantId, id } },
        body: input,
      });
      if (error) throw error;
      return data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: leaveTypesKey(tenantId) }),
  });
}

// --- Self-service leave requests ---

export function useMyLeaveRequests(tenantId: string) {
  return useQuery({
    queryKey: myLeaveRequestsKey(tenantId),
    queryFn: async () => {
      const { data, error } = await apiClient.GET('/api/tenants/{tenantId}/leave-requests/me', {
        params: { path: { tenantId } },
      });
      if (error) throw error;
      return data;
    },
  });
}

export function useCreateMyLeaveRequest(tenantId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: CreateLeaveRequestInput) => {
      const { data, error } = await apiClient.POST('/api/tenants/{tenantId}/leave-requests/me', {
        params: { path: { tenantId } },
        body: input,
      });
      if (error) throw error;
      return data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: myLeaveRequestsKey(tenantId) }),
  });
}

export function useCancelMyLeaveRequest(tenantId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { data, error } = await apiClient.POST(
        '/api/tenants/{tenantId}/leave-requests/me/{id}/cancel',
        { params: { path: { tenantId, id } } },
      );
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: myLeaveRequestsKey(tenantId) });
      // Cancelling an APPROVED request refunds its days to the balance.
      queryClient.invalidateQueries({ queryKey: myLeaveBalancesKey(tenantId) });
    },
  });
}

export function useMyLeaveBalances(tenantId: string) {
  return useQuery({
    queryKey: myLeaveBalancesKey(tenantId),
    queryFn: async () => {
      const { data, error } = await apiClient.GET('/api/tenants/{tenantId}/leave-balances/me', {
        params: { path: { tenantId } },
      });
      if (error) throw error;
      return data;
    },
  });
}

// --- HR approval queue ---

export function useLeaveRequests(tenantId: string, status?: LeaveRequestStatus) {
  return useQuery({
    queryKey: [...leaveRequestsKey(tenantId), status ?? 'ALL'],
    queryFn: async () => {
      const { data, error } = await apiClient.GET('/api/tenants/{tenantId}/leave-requests', {
        params: { path: { tenantId }, query: status ? { status } : {} },
      });
      if (error) throw error;
      return data;
    },
  });
}

export function useApproveLeaveRequest(tenantId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { data, error } = await apiClient.POST(
        '/api/tenants/{tenantId}/leave-requests/{id}/approve',
        { params: { path: { tenantId, id } } },
      );
      if (error) throw error;
      return data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: leaveRequestsKey(tenantId) }),
  });
}

export function useRejectLeaveRequest(tenantId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, rejectionReason }: { id: string; rejectionReason: string }) => {
      const { data, error } = await apiClient.POST(
        '/api/tenants/{tenantId}/leave-requests/{id}/reject',
        { params: { path: { tenantId, id } }, body: { rejectionReason } },
      );
      if (error) throw error;
      return data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: leaveRequestsKey(tenantId) }),
  });
}

/** HR-facing: correct or grant an arbitrary employee's leave balance. */
export function useAdjustLeaveBalance(tenantId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: AdjustLeaveBalanceInput) => {
      const { data, error } = await apiClient.POST(
        '/api/tenants/{tenantId}/leave-requests/adjust-balance',
        { params: { path: { tenantId } }, body: input },
      );
      if (error) throw error;
      return data;
    },
    // Only affects the adjusted employee's own balances view, which this
    // HR-facing mutation doesn't have a local cache entry for unless the
    // caller happens to be adjusting their own - invalidate defensively.
    onSuccess: () => queryClient.invalidateQueries({ queryKey: myLeaveBalancesKey(tenantId) }),
  });
}

// --- Direct-manager approval queue (dynamic Employee.managerId relationship,
// not a role permission — visible/usable by any tenant member who has
// direct reports, mirroring performance's Team Reviews) ---

export function useTeamLeaveRequests(tenantId: string) {
  return useQuery({
    queryKey: teamLeaveRequestsKey(tenantId),
    queryFn: async () => {
      const { data, error } = await apiClient.GET('/api/tenants/{tenantId}/leave-requests/team', {
        params: { path: { tenantId } },
      });
      if (error) throw error;
      return data;
    },
  });
}

export function useApproveTeamLeaveRequest(tenantId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { data, error } = await apiClient.POST(
        '/api/tenants/{tenantId}/leave-requests/team/{id}/approve',
        { params: { path: { tenantId, id } } },
      );
      if (error) throw error;
      return data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: teamLeaveRequestsKey(tenantId) }),
  });
}

export function useRejectTeamLeaveRequest(tenantId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, rejectionReason }: { id: string; rejectionReason: string }) => {
      const { data, error } = await apiClient.POST(
        '/api/tenants/{tenantId}/leave-requests/team/{id}/reject',
        { params: { path: { tenantId, id } }, body: { rejectionReason } },
      );
      if (error) throw error;
      return data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: teamLeaveRequestsKey(tenantId) }),
  });
}
