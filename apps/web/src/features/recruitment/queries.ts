'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import type {
  AdvanceApplicationInput,
  ApplicationStage,
  CreateApplicationInput,
  CreateCandidateInput,
  CreateJobRequisitionInput,
  JobRequisitionStatus,
  LinkHiredEmployeeInput,
  RespondToOfferInput,
  SendOfferInput,
  UpdateCandidateInput,
  UpdateJobRequisitionInput,
} from './types';

function requisitionsKey(tenantId: string) {
  return ['job-requisitions', 'all', tenantId] as const;
}

function requisitionKey(tenantId: string, id: string) {
  return ['job-requisitions', 'detail', tenantId, id] as const;
}

function myRequisitionsKey(tenantId: string) {
  return ['job-requisitions', 'mine', tenantId] as const;
}

function myRequisitionKey(tenantId: string, id: string) {
  return ['job-requisitions', 'mine', 'detail', tenantId, id] as const;
}

function candidatesKey(tenantId: string) {
  return ['candidates', tenantId] as const;
}

function candidateKey(tenantId: string, id: string) {
  return ['candidates', 'detail', tenantId, id] as const;
}

function applicationsKey(tenantId: string) {
  return ['applications', 'all', tenantId] as const;
}

function applicationKey(tenantId: string, id: string) {
  return ['applications', 'detail', tenantId, id] as const;
}

function myApplicationsKey(tenantId: string) {
  return ['applications', 'mine', tenantId] as const;
}

function myApplicationKey(tenantId: string, id: string) {
  return ['applications', 'mine', 'detail', tenantId, id] as const;
}

// --- Job requisitions (HR) ---

export function useRequisitions(
  tenantId: string,
  filters: { organizationId?: string; hiringManagerId?: string; status?: JobRequisitionStatus } = {},
) {
  return useQuery({
    queryKey: [
      ...requisitionsKey(tenantId),
      filters.organizationId ?? '',
      filters.hiringManagerId ?? '',
      filters.status ?? '',
    ],
    queryFn: async () => {
      const { data, error } = await apiClient.GET('/api/tenants/{tenantId}/job-requisitions', {
        params: { path: { tenantId }, query: filters },
      });
      if (error) throw error;
      return data;
    },
  });
}

export function useRequisition(tenantId: string, id: string) {
  return useQuery({
    queryKey: requisitionKey(tenantId, id),
    queryFn: async () => {
      const { data, error } = await apiClient.GET('/api/tenants/{tenantId}/job-requisitions/{id}', {
        params: { path: { tenantId, id } },
      });
      if (error) throw error;
      return data;
    },
    enabled: Boolean(id),
  });
}

export function useCreateRequisition(tenantId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: CreateJobRequisitionInput) => {
      const { data, error } = await apiClient.POST('/api/tenants/{tenantId}/job-requisitions', {
        params: { path: { tenantId } },
        body: input,
      });
      if (error) throw error;
      return data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: requisitionsKey(tenantId) }),
  });
}

export function useUpdateRequisition(tenantId: string, id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: UpdateJobRequisitionInput) => {
      const { data, error } = await apiClient.PATCH(
        '/api/tenants/{tenantId}/job-requisitions/{id}',
        { params: { path: { tenantId, id } }, body: input },
      );
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: requisitionsKey(tenantId) });
      queryClient.invalidateQueries({ queryKey: requisitionKey(tenantId, id) });
    },
  });
}

// --- Job requisitions (hiring-manager tier) ---

export function useMyRequisitions(tenantId: string) {
  return useQuery({
    queryKey: myRequisitionsKey(tenantId),
    queryFn: async () => {
      const { data, error } = await apiClient.GET('/api/tenants/{tenantId}/job-requisitions/mine', {
        params: { path: { tenantId } },
      });
      if (error) throw error;
      return data;
    },
  });
}

export function useMyRequisition(tenantId: string, id: string) {
  return useQuery({
    queryKey: myRequisitionKey(tenantId, id),
    queryFn: async () => {
      const { data, error } = await apiClient.GET(
        '/api/tenants/{tenantId}/job-requisitions/mine/{id}',
        { params: { path: { tenantId, id } } },
      );
      if (error) throw error;
      return data;
    },
    enabled: Boolean(id),
  });
}

export function useUpdateMyRequisition(tenantId: string, id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: UpdateJobRequisitionInput) => {
      const { data, error } = await apiClient.PATCH(
        '/api/tenants/{tenantId}/job-requisitions/mine/{id}',
        { params: { path: { tenantId, id } }, body: input },
      );
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: myRequisitionsKey(tenantId) });
      queryClient.invalidateQueries({ queryKey: myRequisitionKey(tenantId, id) });
    },
  });
}

// --- Candidates ---

export function useCandidates(tenantId: string, email?: string) {
  return useQuery({
    queryKey: [...candidatesKey(tenantId), email ?? ''],
    queryFn: async () => {
      const { data, error } = await apiClient.GET('/api/tenants/{tenantId}/candidates', {
        params: { path: { tenantId }, query: email ? { email } : {} },
      });
      if (error) throw error;
      return data;
    },
  });
}

export function useCandidate(tenantId: string, id: string) {
  return useQuery({
    queryKey: candidateKey(tenantId, id),
    queryFn: async () => {
      const { data, error } = await apiClient.GET('/api/tenants/{tenantId}/candidates/{id}', {
        params: { path: { tenantId, id } },
      });
      if (error) throw error;
      return data;
    },
    enabled: Boolean(id),
  });
}

export function useCreateCandidate(tenantId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: CreateCandidateInput) => {
      const { data, error } = await apiClient.POST('/api/tenants/{tenantId}/candidates', {
        params: { path: { tenantId } },
        body: input,
      });
      if (error) throw error;
      return data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: candidatesKey(tenantId) }),
  });
}

export function useUpdateCandidate(tenantId: string, id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: UpdateCandidateInput) => {
      const { data, error } = await apiClient.PATCH('/api/tenants/{tenantId}/candidates/{id}', {
        params: { path: { tenantId, id } },
        body: input,
      });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: candidatesKey(tenantId) });
      queryClient.invalidateQueries({ queryKey: candidateKey(tenantId, id) });
    },
  });
}

// --- Applications (HR) ---

export function useApplications(
  tenantId: string,
  filters: { candidateId?: string; requisitionId?: string; stage?: ApplicationStage } = {},
) {
  return useQuery({
    queryKey: [
      ...applicationsKey(tenantId),
      filters.candidateId ?? '',
      filters.requisitionId ?? '',
      filters.stage ?? '',
    ],
    queryFn: async () => {
      const { data, error } = await apiClient.GET('/api/tenants/{tenantId}/applications', {
        params: { path: { tenantId }, query: filters },
      });
      if (error) throw error;
      return data;
    },
  });
}

export function useApplication(tenantId: string, id: string) {
  return useQuery({
    queryKey: applicationKey(tenantId, id),
    queryFn: async () => {
      const { data, error } = await apiClient.GET('/api/tenants/{tenantId}/applications/{id}', {
        params: { path: { tenantId, id } },
      });
      if (error) throw error;
      return data;
    },
    enabled: Boolean(id),
  });
}

export function useCreateApplication(tenantId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: CreateApplicationInput) => {
      const { data, error } = await apiClient.POST('/api/tenants/{tenantId}/applications', {
        params: { path: { tenantId } },
        body: input,
      });
      if (error) throw error;
      return data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: applicationsKey(tenantId) }),
  });
}

export function useAdvanceApplication(tenantId: string, id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: AdvanceApplicationInput) => {
      const { data, error } = await apiClient.PATCH(
        '/api/tenants/{tenantId}/applications/{id}/stage',
        { params: { path: { tenantId, id } }, body: input },
      );
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: applicationsKey(tenantId) });
      queryClient.invalidateQueries({ queryKey: applicationKey(tenantId, id) });
    },
  });
}

export function useSendOffer(tenantId: string, id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: SendOfferInput) => {
      const { data, error } = await apiClient.POST('/api/tenants/{tenantId}/applications/{id}/offer', {
        params: { path: { tenantId, id } },
        body: input,
      });
      if (error) throw error;
      return data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: applicationKey(tenantId, id) }),
  });
}

export function useRespondToOffer(tenantId: string, id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: RespondToOfferInput) => {
      const { data, error } = await apiClient.POST(
        '/api/tenants/{tenantId}/applications/{id}/offer/response',
        { params: { path: { tenantId, id } }, body: input },
      );
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: applicationsKey(tenantId) });
      queryClient.invalidateQueries({ queryKey: applicationKey(tenantId, id) });
    },
  });
}

export function useLinkHiredEmployee(tenantId: string, id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: LinkHiredEmployeeInput) => {
      const { data, error } = await apiClient.POST(
        '/api/tenants/{tenantId}/applications/{id}/hired-employee',
        { params: { path: { tenantId, id } }, body: input },
      );
      if (error) throw error;
      return data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: applicationKey(tenantId, id) }),
  });
}

// --- Applications (hiring-manager tier) ---

export function useMyApplications(tenantId: string) {
  return useQuery({
    queryKey: myApplicationsKey(tenantId),
    queryFn: async () => {
      const { data, error } = await apiClient.GET('/api/tenants/{tenantId}/applications/mine', {
        params: { path: { tenantId } },
      });
      if (error) throw error;
      return data;
    },
  });
}

export function useMyApplication(tenantId: string, id: string) {
  return useQuery({
    queryKey: myApplicationKey(tenantId, id),
    queryFn: async () => {
      const { data, error } = await apiClient.GET(
        '/api/tenants/{tenantId}/applications/mine/{id}',
        { params: { path: { tenantId, id } } },
      );
      if (error) throw error;
      return data;
    },
    enabled: Boolean(id),
  });
}

export function useAdvanceMyApplication(tenantId: string, id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: AdvanceApplicationInput) => {
      const { data, error } = await apiClient.PATCH(
        '/api/tenants/{tenantId}/applications/mine/{id}/stage',
        { params: { path: { tenantId, id } }, body: input },
      );
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: myApplicationsKey(tenantId) });
      queryClient.invalidateQueries({ queryKey: myApplicationKey(tenantId, id) });
    },
  });
}
