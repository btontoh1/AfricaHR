'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import type { CreateEmployeeInput, UpdateEmployeeInput, UpdateEmploymentStatusInput } from './types';

function employeesKey(tenantId: string) {
  return ['employees', tenantId] as const;
}

function employeeKey(tenantId: string, id: string) {
  return ['employees', tenantId, id] as const;
}

export function useEmployees(tenantId: string) {
  return useQuery({
    queryKey: employeesKey(tenantId),
    queryFn: async () => {
      const { data, error } = await apiClient.GET('/api/tenants/{tenantId}/employees', {
        params: { path: { tenantId } },
      });
      if (error) throw error;
      return data;
    },
  });
}

export function useEmployee(tenantId: string, id: string) {
  return useQuery({
    queryKey: employeeKey(tenantId, id),
    queryFn: async () => {
      const { data, error } = await apiClient.GET('/api/tenants/{tenantId}/employees/{id}', {
        params: { path: { tenantId, id } },
      });
      if (error) throw error;
      return data;
    },
    enabled: Boolean(id),
  });
}

export function useCreateEmployee(tenantId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: CreateEmployeeInput) => {
      const { data, error } = await apiClient.POST('/api/tenants/{tenantId}/employees', {
        params: { path: { tenantId } },
        body: input,
      });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: employeesKey(tenantId) });
    },
  });
}

export function useUpdateEmployee(tenantId: string, id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: UpdateEmployeeInput) => {
      const { data, error } = await apiClient.PATCH('/api/tenants/{tenantId}/employees/{id}', {
        params: { path: { tenantId, id } },
        body: input,
      });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: employeesKey(tenantId) });
      queryClient.invalidateQueries({ queryKey: employeeKey(tenantId, id) });
    },
  });
}

export function useUpdateEmploymentStatus(tenantId: string, id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: UpdateEmploymentStatusInput) => {
      const { data, error } = await apiClient.PATCH(
        '/api/tenants/{tenantId}/employees/{id}/status',
        {
          params: { path: { tenantId, id } },
          body: input,
        },
      );
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: employeesKey(tenantId) });
      queryClient.invalidateQueries({ queryKey: employeeKey(tenantId, id) });
    },
  });
}
