'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import type {
  CreateEmployeeInput,
  UpdateEmployeeInput,
  UpdateEmploymentStatusInput,
  UpsertPaymentMethodInput,
} from './types';

function employeesKey(tenantId: string) {
  return ['employees', tenantId] as const;
}

function employeeKey(tenantId: string, id: string) {
  return ['employees', tenantId, id] as const;
}

function myPaymentMethodKey(tenantId: string) {
  return ['payment-method', 'me', tenantId] as const;
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

// --- Self-service ---

export function useMyPaymentMethod(tenantId: string) {
  return useQuery({
    queryKey: myPaymentMethodKey(tenantId),
    queryFn: async () => {
      const { data, error } = await apiClient.GET('/api/tenants/{tenantId}/employees/me/payment-method', {
        params: { path: { tenantId } },
      });
      if (error) throw error;
      // NestJS sends an empty body (not JSON "null") for a controller
      // returning null, so a not-yet-configured payment method comes back
      // as `data: undefined` here - react-query rejects undefined query
      // results outright, so this must be coerced to null explicitly.
      return data ?? null;
    },
  });
}

export function useUpsertMyPaymentMethod(tenantId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: UpsertPaymentMethodInput) => {
      const { data, error } = await apiClient.PUT('/api/tenants/{tenantId}/employees/me/payment-method', {
        params: { path: { tenantId } },
        body: input,
      });
      if (error) throw error;
      return data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: myPaymentMethodKey(tenantId) }),
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
