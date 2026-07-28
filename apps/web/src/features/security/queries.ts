'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';

export function mfaStatusKey() {
  return ['mfa-status'] as const;
}

export function useMfaStatus() {
  return useQuery({
    queryKey: mfaStatusKey(),
    queryFn: async () => {
      const { data, error } = await apiClient.GET('/api/users/me/mfa/status');
      if (error) throw error;
      return data;
    },
  });
}

export function useMfaSetup() {
  return useMutation({
    mutationFn: async () => {
      const { data, error } = await apiClient.POST('/api/users/me/mfa/setup');
      if (error) throw error;
      return data;
    },
  });
}

export function useMfaConfirm() {
  // Deliberately does NOT invalidate mfa-status here: that would flip the
  // parent MfaSecurityCard to its "enabled" view immediately, unmounting
  // this enrollment flow before the user ever sees their backup codes.
  // The caller invalidates once the user has acknowledged them instead
  // (see MfaEnrollment's onDone).
  return useMutation({
    mutationFn: async (code: string) => {
      const { data, error } = await apiClient.POST('/api/users/me/mfa/confirm', { body: { code } });
      if (error) throw error;
      return data;
    },
  });
}

export function useMfaDisable() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (password: string) => {
      const { error } = await apiClient.POST('/api/users/me/mfa/disable', { body: { password } });
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: mfaStatusKey() }),
  });
}
