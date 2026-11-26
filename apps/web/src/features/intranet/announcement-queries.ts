'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import type { CreateAnnouncementInput } from './announcement-types';

function announcementsKey(tenantId: string) {
  return ['intranet-announcements', tenantId] as const;
}

function myAnnouncementsKey(tenantId: string) {
  return ['intranet-my-announcements', tenantId] as const;
}

export function useAnnouncements(tenantId: string) {
  return useQuery({
    queryKey: announcementsKey(tenantId),
    queryFn: async () => {
      const { data, error } = await apiClient.GET('/api/tenants/{tenantId}/announcements', {
        params: { path: { tenantId } },
      });
      if (error) throw error;
      return data;
    },
  });
}

export function useCreateAnnouncement(tenantId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: CreateAnnouncementInput) => {
      const { data, error } = await apiClient.POST('/api/tenants/{tenantId}/announcements', {
        params: { path: { tenantId } },
        body: input,
      });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: announcementsKey(tenantId) });
    },
  });
}

export function useSetAnnouncementPinned(tenantId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, pinned }: { id: string; pinned: boolean }) => {
      const { data, error } = await apiClient.PATCH('/api/tenants/{tenantId}/announcements/{id}/pin', {
        params: { path: { tenantId, id } },
        body: { pinned },
      });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: announcementsKey(tenantId) });
    },
  });
}

export function useAnnouncementAttachmentViewUrl(tenantId: string) {
  return useMutation({
    mutationFn: async (id: string) => {
      const { data, error } = await apiClient.GET('/api/tenants/{tenantId}/announcements/{id}/attachment-view-url', {
        params: { path: { tenantId, id } },
      });
      if (error) throw error;
      return data.viewUrl;
    },
  });
}

export function useMyAnnouncements(tenantId: string) {
  return useQuery({
    queryKey: myAnnouncementsKey(tenantId),
    queryFn: async () => {
      const { data, error } = await apiClient.GET('/api/tenants/{tenantId}/announcements/me', {
        params: { path: { tenantId } },
      });
      if (error) throw error;
      return data;
    },
  });
}

export function useMyAnnouncementAttachmentViewUrl(tenantId: string) {
  return useMutation({
    mutationFn: async (id: string) => {
      const { data, error } = await apiClient.GET(
        '/api/tenants/{tenantId}/announcements/me/{id}/attachment-view-url',
        { params: { path: { tenantId, id } } },
      );
      if (error) throw error;
      return data.viewUrl;
    },
  });
}

export function useMarkAnnouncementRead(tenantId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { data, error } = await apiClient.POST('/api/tenants/{tenantId}/announcements/me/{id}/read', {
        params: { path: { tenantId, id } },
      });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: myAnnouncementsKey(tenantId) });
    },
  });
}
