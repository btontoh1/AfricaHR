'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import type { CreateHowItWorksVideoInput, UpdateHowItWorksVideoInput } from './types';

const howItWorksVideosKey = ['how-it-works-videos'] as const;

export function useHowItWorksVideos() {
  return useQuery({
    queryKey: howItWorksVideosKey,
    queryFn: async () => {
      const { data, error } = await apiClient.GET('/api/how-it-works-videos', {});
      if (error) throw error;
      return data;
    },
  });
}

export function useCreateHowItWorksVideo() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: CreateHowItWorksVideoInput) => {
      const { data, error } = await apiClient.POST('/api/how-it-works-videos', { body: input });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: howItWorksVideosKey });
    },
  });
}

export function useUpdateHowItWorksVideo(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: UpdateHowItWorksVideoInput) => {
      const { data, error } = await apiClient.PATCH('/api/how-it-works-videos/{id}', {
        params: { path: { id } },
        body: input,
      });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: howItWorksVideosKey });
    },
  });
}

export function useDeleteHowItWorksVideo() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await apiClient.DELETE('/api/how-it-works-videos/{id}', {
        params: { path: { id } },
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: howItWorksVideosKey });
    },
  });
}
