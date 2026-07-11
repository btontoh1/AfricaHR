'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import type {
  CreateNotificationTemplateInput,
  NotificationStatus,
  SendFromTemplateInput,
  SendNotificationInput,
  UpdateNotificationTemplateInput,
} from './types';

function templatesKey(tenantId: string) {
  return ['notification-templates', tenantId] as const;
}

function myNotificationsKey(tenantId: string) {
  return ['notifications', 'me', tenantId] as const;
}

function allNotificationsKey(tenantId: string) {
  return ['notifications', 'all', tenantId] as const;
}

// --- Templates (HR admin) ---

export function useNotificationTemplates(tenantId: string, activeOnly?: boolean) {
  return useQuery({
    queryKey: [...templatesKey(tenantId), activeOnly ?? false],
    queryFn: async () => {
      const { data, error } = await apiClient.GET(
        '/api/tenants/{tenantId}/notification-templates',
        { params: { path: { tenantId }, query: activeOnly ? { activeOnly: 'true' } : {} } },
      );
      if (error) throw error;
      return data;
    },
  });
}

export function useCreateNotificationTemplate(tenantId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: CreateNotificationTemplateInput) => {
      const { data, error } = await apiClient.POST(
        '/api/tenants/{tenantId}/notification-templates',
        { params: { path: { tenantId } }, body: input },
      );
      if (error) throw error;
      return data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: templatesKey(tenantId) }),
  });
}

export function useUpdateNotificationTemplate(tenantId: string, id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: UpdateNotificationTemplateInput) => {
      const { data, error } = await apiClient.PATCH(
        '/api/tenants/{tenantId}/notification-templates/{id}',
        { params: { path: { tenantId, id } }, body: input },
      );
      if (error) throw error;
      return data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: templatesKey(tenantId) }),
  });
}

// --- Self-service inbox ---

export function useMyNotifications(tenantId: string) {
  return useQuery({
    queryKey: myNotificationsKey(tenantId),
    queryFn: async () => {
      const { data, error } = await apiClient.GET('/api/tenants/{tenantId}/notifications/me', {
        params: { path: { tenantId } },
      });
      if (error) throw error;
      return data;
    },
  });
}

export function useMarkNotificationRead(tenantId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { data, error } = await apiClient.POST(
        '/api/tenants/{tenantId}/notifications/me/{id}/read',
        { params: { path: { tenantId, id } } },
      );
      if (error) throw error;
      return data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: myNotificationsKey(tenantId) }),
  });
}

// --- HR admin ---

export function useAllNotifications(
  tenantId: string,
  filters: { userId?: string; status?: NotificationStatus } = {},
) {
  return useQuery({
    queryKey: [...allNotificationsKey(tenantId), filters.userId ?? '', filters.status ?? ''],
    queryFn: async () => {
      const { data, error } = await apiClient.GET('/api/tenants/{tenantId}/notifications', {
        params: { path: { tenantId }, query: filters },
      });
      if (error) throw error;
      return data;
    },
  });
}

export function useSendNotification(tenantId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: SendNotificationInput) => {
      const { data, error } = await apiClient.POST('/api/tenants/{tenantId}/notifications', {
        params: { path: { tenantId } },
        body: input,
      });
      if (error) throw error;
      return data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: allNotificationsKey(tenantId) }),
  });
}

export function useSendFromTemplate(tenantId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: SendFromTemplateInput) => {
      const { data, error } = await apiClient.POST(
        '/api/tenants/{tenantId}/notifications/from-template',
        { params: { path: { tenantId } }, body: input },
      );
      if (error) throw error;
      return data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: allNotificationsKey(tenantId) }),
  });
}
