'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import type {
  CreatePerformanceGoalInput,
  CreateReviewCycleInput,
  PerformanceReviewStatus,
  StartReviewForEmployeeInput,
  SubmitManagerAssessmentInput,
  SubmitSelfAssessmentInput,
  UpdatePerformanceGoalInput,
  UpdateReviewCycleInput,
} from './types';

function myGoalsKey(tenantId: string) {
  return ['performance-goals', 'me', tenantId] as const;
}

function reviewCyclesKey(tenantId: string) {
  return ['review-cycles', tenantId] as const;
}

function myReviewsKey(tenantId: string) {
  return ['performance-reviews', 'me', tenantId] as const;
}

function myReviewKey(tenantId: string, id: string) {
  return ['performance-reviews', 'me', 'detail', tenantId, id] as const;
}

function teamReviewsKey(tenantId: string) {
  return ['performance-reviews', 'team', tenantId] as const;
}

function teamReviewKey(tenantId: string, id: string) {
  return ['performance-reviews', 'team', 'detail', tenantId, id] as const;
}

function allReviewsKey(tenantId: string) {
  return ['performance-reviews', 'all', tenantId] as const;
}

function allReviewKey(tenantId: string, id: string) {
  return ['performance-reviews', 'all', 'detail', tenantId, id] as const;
}

// --- Self-service goals ---

export function useMyGoals(tenantId: string) {
  return useQuery({
    queryKey: myGoalsKey(tenantId),
    queryFn: async () => {
      const { data, error } = await apiClient.GET('/api/tenants/{tenantId}/performance-goals/me', {
        params: { path: { tenantId } },
      });
      if (error) throw error;
      return data;
    },
  });
}

export function useCreateMyGoal(tenantId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: CreatePerformanceGoalInput) => {
      const { data, error } = await apiClient.POST('/api/tenants/{tenantId}/performance-goals/me', {
        params: { path: { tenantId } },
        body: input,
      });
      if (error) throw error;
      return data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: myGoalsKey(tenantId) }),
  });
}

export function useUpdateMyGoal(tenantId: string, id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: UpdatePerformanceGoalInput) => {
      const { data, error } = await apiClient.PATCH(
        '/api/tenants/{tenantId}/performance-goals/me/{id}',
        { params: { path: { tenantId, id } }, body: input },
      );
      if (error) throw error;
      return data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: myGoalsKey(tenantId) }),
  });
}

// --- Review cycles (shared catalog, open read to any authenticated tenant member) ---

export function useReviewCycles(tenantId: string) {
  return useQuery({
    queryKey: reviewCyclesKey(tenantId),
    queryFn: async () => {
      const { data, error } = await apiClient.GET('/api/tenants/{tenantId}/review-cycles', {
        params: { path: { tenantId } },
      });
      if (error) throw error;
      return data;
    },
  });
}

export function useCreateReviewCycle(tenantId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: CreateReviewCycleInput) => {
      const { data, error } = await apiClient.POST('/api/tenants/{tenantId}/review-cycles', {
        params: { path: { tenantId } },
        body: input,
      });
      if (error) throw error;
      return data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: reviewCyclesKey(tenantId) }),
  });
}

export function useUpdateReviewCycle(tenantId: string, id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: UpdateReviewCycleInput) => {
      const { data, error } = await apiClient.PATCH('/api/tenants/{tenantId}/review-cycles/{id}', {
        params: { path: { tenantId, id } },
        body: input,
      });
      if (error) throw error;
      return data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: reviewCyclesKey(tenantId) }),
  });
}

// --- Self-service reviews ---

export function useMyReviews(tenantId: string) {
  return useQuery({
    queryKey: myReviewsKey(tenantId),
    queryFn: async () => {
      const { data, error } = await apiClient.GET('/api/tenants/{tenantId}/performance-reviews/me', {
        params: { path: { tenantId } },
      });
      if (error) throw error;
      return data;
    },
  });
}

export function useMyReview(tenantId: string, id: string) {
  return useQuery({
    queryKey: myReviewKey(tenantId, id),
    queryFn: async () => {
      const { data, error } = await apiClient.GET(
        '/api/tenants/{tenantId}/performance-reviews/me/{id}',
        { params: { path: { tenantId, id } } },
      );
      if (error) throw error;
      return data;
    },
    enabled: Boolean(id),
  });
}

export function useStartMyReview(tenantId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (cycleId: string) => {
      const { data, error } = await apiClient.POST('/api/tenants/{tenantId}/performance-reviews/me', {
        params: { path: { tenantId } },
        body: { cycleId },
      });
      if (error) throw error;
      return data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: myReviewsKey(tenantId) }),
  });
}

export function useSubmitSelfAssessment(tenantId: string, id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: SubmitSelfAssessmentInput) => {
      const { data, error } = await apiClient.POST(
        '/api/tenants/{tenantId}/performance-reviews/me/{id}/self-assessment',
        { params: { path: { tenantId, id } }, body: input },
      );
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: myReviewsKey(tenantId) });
      queryClient.invalidateQueries({ queryKey: myReviewKey(tenantId, id) });
    },
  });
}

// --- Manager (direct reports) tier ---

export function useTeamReviews(tenantId: string) {
  return useQuery({
    queryKey: teamReviewsKey(tenantId),
    queryFn: async () => {
      const { data, error } = await apiClient.GET(
        '/api/tenants/{tenantId}/performance-reviews/team',
        { params: { path: { tenantId } } },
      );
      if (error) throw error;
      return data;
    },
  });
}

export function useTeamReview(tenantId: string, id: string) {
  return useQuery({
    queryKey: teamReviewKey(tenantId, id),
    queryFn: async () => {
      const { data, error } = await apiClient.GET(
        '/api/tenants/{tenantId}/performance-reviews/team/{id}',
        { params: { path: { tenantId, id } } },
      );
      if (error) throw error;
      return data;
    },
    enabled: Boolean(id),
  });
}

export function useSubmitManagerAssessment(tenantId: string, id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: SubmitManagerAssessmentInput) => {
      const { data, error } = await apiClient.POST(
        '/api/tenants/{tenantId}/performance-reviews/team/{id}/manager-assessment',
        { params: { path: { tenantId, id } }, body: input },
      );
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: teamReviewsKey(tenantId) });
      queryClient.invalidateQueries({ queryKey: teamReviewKey(tenantId, id) });
    },
  });
}

// --- HR admin ---

export function useAllReviews(
  tenantId: string,
  filters: { employeeId?: string; cycleId?: string; status?: PerformanceReviewStatus } = {},
) {
  return useQuery({
    queryKey: [
      ...allReviewsKey(tenantId),
      filters.employeeId ?? '',
      filters.cycleId ?? '',
      filters.status ?? '',
    ],
    queryFn: async () => {
      const { data, error } = await apiClient.GET('/api/tenants/{tenantId}/performance-reviews', {
        params: { path: { tenantId }, query: filters },
      });
      if (error) throw error;
      return data;
    },
  });
}

export function useAllReview(tenantId: string, id: string) {
  return useQuery({
    queryKey: allReviewKey(tenantId, id),
    queryFn: async () => {
      const { data, error } = await apiClient.GET(
        '/api/tenants/{tenantId}/performance-reviews/{id}',
        { params: { path: { tenantId, id } } },
      );
      if (error) throw error;
      return data;
    },
    enabled: Boolean(id),
  });
}

export function useStartReviewForEmployee(tenantId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: StartReviewForEmployeeInput) => {
      const { data, error } = await apiClient.POST('/api/tenants/{tenantId}/performance-reviews', {
        params: { path: { tenantId } },
        body: input,
      });
      if (error) throw error;
      return data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: allReviewsKey(tenantId) }),
  });
}

export function useCancelReview(tenantId: string, id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      const { data, error } = await apiClient.POST(
        '/api/tenants/{tenantId}/performance-reviews/{id}/cancel',
        { params: { path: { tenantId, id } } },
      );
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: allReviewsKey(tenantId) });
      queryClient.invalidateQueries({ queryKey: allReviewKey(tenantId, id) });
    },
  });
}
