'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import type {
  BenefitEnrollmentStatus,
  CreateBenefitEnrollmentInput,
  CreateBenefitPlanInput,
  EnrollEmployeeInput,
  UpdateBenefitPlanInput,
} from './types';

function benefitPlansKey(tenantId: string) {
  return ['benefit-plans', tenantId] as const;
}

function myEnrollmentsKey(tenantId: string) {
  return ['benefit-enrollments', 'me', tenantId] as const;
}

function enrollmentsKey(tenantId: string) {
  return ['benefit-enrollments', 'all', tenantId] as const;
}

function contributionKey(tenantId: string, id: string) {
  return ['benefit-enrollments', 'contribution', tenantId, id] as const;
}

function myContributionKey(tenantId: string, id: string) {
  return ['benefit-enrollments', 'contribution', 'me', tenantId, id] as const;
}

// --- Benefit plans (shared catalog, open read to any authenticated tenant member) ---

export function useBenefitPlans(tenantId: string, activeOnly?: boolean) {
  return useQuery({
    queryKey: [...benefitPlansKey(tenantId), activeOnly ?? false],
    queryFn: async () => {
      const { data, error } = await apiClient.GET('/api/tenants/{tenantId}/benefit-plans', {
        params: { path: { tenantId }, query: activeOnly ? { activeOnly: 'true' } : {} },
      });
      if (error) throw error;
      return data;
    },
  });
}

export function useCreateBenefitPlan(tenantId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: CreateBenefitPlanInput) => {
      const { data, error } = await apiClient.POST('/api/tenants/{tenantId}/benefit-plans', {
        params: { path: { tenantId } },
        body: input,
      });
      if (error) throw error;
      return data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: benefitPlansKey(tenantId) }),
  });
}

export function useUpdateBenefitPlan(tenantId: string, id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: UpdateBenefitPlanInput) => {
      const { data, error } = await apiClient.PATCH('/api/tenants/{tenantId}/benefit-plans/{id}', {
        params: { path: { tenantId, id } },
        body: input,
      });
      if (error) throw error;
      return data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: benefitPlansKey(tenantId) }),
  });
}

// --- Self-service enrollments ---

export function useMyBenefitEnrollments(tenantId: string) {
  return useQuery({
    queryKey: myEnrollmentsKey(tenantId),
    queryFn: async () => {
      const { data, error } = await apiClient.GET('/api/tenants/{tenantId}/benefit-enrollments/me', {
        params: { path: { tenantId } },
      });
      if (error) throw error;
      return data;
    },
  });
}

export function useEnrollInBenefitPlan(tenantId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: CreateBenefitEnrollmentInput) => {
      const { data, error } = await apiClient.POST('/api/tenants/{tenantId}/benefit-enrollments/me', {
        params: { path: { tenantId } },
        body: input,
      });
      if (error) throw error;
      return data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: myEnrollmentsKey(tenantId) }),
  });
}

export function useCancelMyBenefitEnrollment(tenantId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { data, error } = await apiClient.POST(
        '/api/tenants/{tenantId}/benefit-enrollments/me/{id}/cancel',
        { params: { path: { tenantId, id } } },
      );
      if (error) throw error;
      return data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: myEnrollmentsKey(tenantId) }),
  });
}

// --- HR admin ---

export function useBenefitEnrollments(
  tenantId: string,
  filters: { employeeId?: string; benefitPlanId?: string; status?: BenefitEnrollmentStatus } = {},
) {
  return useQuery({
    queryKey: [
      ...enrollmentsKey(tenantId),
      filters.employeeId ?? '',
      filters.benefitPlanId ?? '',
      filters.status ?? '',
    ],
    queryFn: async () => {
      const { data, error } = await apiClient.GET('/api/tenants/{tenantId}/benefit-enrollments', {
        params: { path: { tenantId }, query: filters },
      });
      if (error) throw error;
      return data;
    },
  });
}

export function useEnrollEmployee(tenantId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: EnrollEmployeeInput) => {
      const { data, error } = await apiClient.POST('/api/tenants/{tenantId}/benefit-enrollments', {
        params: { path: { tenantId } },
        body: input,
      });
      if (error) throw error;
      return data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: enrollmentsKey(tenantId) }),
  });
}

export function useCancelBenefitEnrollment(tenantId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { data, error } = await apiClient.POST(
        '/api/tenants/{tenantId}/benefit-enrollments/{id}/cancel',
        { params: { path: { tenantId, id } } },
      );
      if (error) throw error;
      return data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: enrollmentsKey(tenantId) }),
  });
}

export function useBenefitContribution(tenantId: string, id: string) {
  return useQuery({
    queryKey: contributionKey(tenantId, id),
    queryFn: async () => {
      const { data, error } = await apiClient.GET(
        '/api/tenants/{tenantId}/benefit-enrollments/{id}/contribution',
        { params: { path: { tenantId, id } } },
      );
      if (error) throw error;
      return data;
    },
    enabled: Boolean(id),
  });
}

// --- Self-service contribution ---

export function useMyBenefitContribution(tenantId: string, id: string) {
  return useQuery({
    queryKey: myContributionKey(tenantId, id),
    queryFn: async () => {
      const { data, error } = await apiClient.GET(
        '/api/tenants/{tenantId}/benefit-enrollments/me/{id}/contribution',
        { params: { path: { tenantId, id } } },
      );
      if (error) throw error;
      return data;
    },
    enabled: Boolean(id),
  });
}
