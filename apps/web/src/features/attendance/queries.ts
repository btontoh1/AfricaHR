'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import type {
  CreateAttendanceLocationInput,
  CreateAttendanceRecordInput,
  SetClockInPinInput,
  UpdateAttendanceLocationInput,
  UpdateAttendanceRecordInput,
  UpsertAttendancePolicyInput,
} from './types';

function myAttendanceKey(tenantId: string) {
  return ['attendance', 'me', tenantId] as const;
}

function attendanceRecordsKey(tenantId: string) {
  return ['attendance', 'all', tenantId] as const;
}

function attendanceRecordKey(tenantId: string, id: string) {
  return ['attendance', 'detail', tenantId, id] as const;
}

function attendancePolicyKey(tenantId: string) {
  return ['attendance-policy', tenantId] as const;
}

function attendanceLocationsKey(tenantId: string) {
  return ['attendance-locations', tenantId] as const;
}

// --- Self-service ---

export function useMyAttendance(tenantId: string, filters: { from?: string; to?: string } = {}) {
  return useQuery({
    queryKey: [...myAttendanceKey(tenantId), filters.from ?? '', filters.to ?? ''],
    queryFn: async () => {
      const { data, error } = await apiClient.GET('/api/tenants/{tenantId}/attendance/me', {
        params: { path: { tenantId }, query: filters },
      });
      if (error) throw error;
      return data;
    },
  });
}

/** Best-effort device position - resolves to undefined (not rejected) on denial, timeout, or an unsupported browser, since clock-in/out must never block on it. */
function getCurrentPosition(): Promise<{ latitude: number; longitude: number } | undefined> {
  if (!('geolocation' in navigator)) {
    return Promise.resolve(undefined);
  }
  return new Promise((resolve) => {
    navigator.geolocation.getCurrentPosition(
      (position) => resolve({ latitude: position.coords.latitude, longitude: position.coords.longitude }),
      () => resolve(undefined),
      { timeout: 5000 },
    );
  });
}

export function useClockIn(tenantId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      const position = await getCurrentPosition();
      const { data, error } = await apiClient.POST(
        '/api/tenants/{tenantId}/attendance/me/clock-in',
        { params: { path: { tenantId } }, body: position ?? {} },
      );
      if (error) throw error;
      return data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: myAttendanceKey(tenantId) }),
  });
}

export function useClockOut(tenantId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      const position = await getCurrentPosition();
      const { data, error } = await apiClient.POST(
        '/api/tenants/{tenantId}/attendance/me/clock-out',
        { params: { path: { tenantId } }, body: position ?? {} },
      );
      if (error) throw error;
      return data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: myAttendanceKey(tenantId) }),
  });
}

// --- HR admin ---

export function useAttendanceRecords(
  tenantId: string,
  filters: { employeeId?: string; from?: string; to?: string } = {},
) {
  return useQuery({
    queryKey: [
      ...attendanceRecordsKey(tenantId),
      filters.employeeId ?? '',
      filters.from ?? '',
      filters.to ?? '',
    ],
    queryFn: async () => {
      const { data, error } = await apiClient.GET('/api/tenants/{tenantId}/attendance', {
        params: { path: { tenantId }, query: filters },
      });
      if (error) throw error;
      return data;
    },
  });
}

export function useAttendanceRecord(tenantId: string, id: string) {
  return useQuery({
    queryKey: attendanceRecordKey(tenantId, id),
    queryFn: async () => {
      const { data, error } = await apiClient.GET('/api/tenants/{tenantId}/attendance/{id}', {
        params: { path: { tenantId, id } },
      });
      if (error) throw error;
      return data;
    },
    enabled: Boolean(id),
  });
}

export function useCreateAttendanceRecord(tenantId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: CreateAttendanceRecordInput) => {
      const { data, error } = await apiClient.POST('/api/tenants/{tenantId}/attendance', {
        params: { path: { tenantId } },
        body: input,
      });
      if (error) throw error;
      return data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: attendanceRecordsKey(tenantId) }),
  });
}

export function useUpdateAttendanceRecord(tenantId: string, id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: UpdateAttendanceRecordInput) => {
      const { data, error } = await apiClient.PATCH('/api/tenants/{tenantId}/attendance/{id}', {
        params: { path: { tenantId, id } },
        body: input,
      });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: attendanceRecordsKey(tenantId) });
      queryClient.invalidateQueries({ queryKey: attendanceRecordKey(tenantId, id) });
    },
  });
}

// --- Policy ---

export function useAttendancePolicy(tenantId: string) {
  return useQuery({
    queryKey: attendancePolicyKey(tenantId),
    queryFn: async () => {
      const { data, error } = await apiClient.GET('/api/tenants/{tenantId}/attendance-policy', {
        params: { path: { tenantId } },
      });
      if (error) throw error;
      return data;
    },
  });
}

export function useUpsertAttendancePolicy(tenantId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: UpsertAttendancePolicyInput) => {
      const { data, error } = await apiClient.POST('/api/tenants/{tenantId}/attendance-policy', {
        params: { path: { tenantId } },
        body: input,
      });
      if (error) throw error;
      return data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: attendancePolicyKey(tenantId) }),
  });
}

// --- Locations ---

export function useAttendanceLocations(tenantId: string) {
  return useQuery({
    queryKey: attendanceLocationsKey(tenantId),
    queryFn: async () => {
      const { data, error } = await apiClient.GET('/api/tenants/{tenantId}/attendance-locations', {
        params: { path: { tenantId } },
      });
      if (error) throw error;
      return data;
    },
  });
}

export function useCreateAttendanceLocation(tenantId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: CreateAttendanceLocationInput) => {
      const { data, error } = await apiClient.POST('/api/tenants/{tenantId}/attendance-locations', {
        params: { path: { tenantId } },
        body: input,
      });
      if (error) throw error;
      return data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: attendanceLocationsKey(tenantId) }),
  });
}

export function useUpdateAttendanceLocation(tenantId: string, id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: UpdateAttendanceLocationInput) => {
      const { data, error } = await apiClient.PATCH('/api/tenants/{tenantId}/attendance-locations/{id}', {
        params: { path: { tenantId, id } },
        body: input,
      });
      if (error) throw error;
      return data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: attendanceLocationsKey(tenantId) }),
  });
}

export function useDeleteAttendanceLocation(tenantId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await apiClient.DELETE('/api/tenants/{tenantId}/attendance-locations/{id}', {
        params: { path: { tenantId, id } },
      });
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: attendanceLocationsKey(tenantId) }),
  });
}

// --- Admin: kiosk PIN ---

/** Sets (or replaces) the employee's kiosk clock-in PIN - admin/HR side of the kiosk feature, not shown to the shared device. */
export function useSetClockInPin(tenantId: string, employeeId: string) {
  return useMutation({
    mutationFn: async (input: SetClockInPinInput) => {
      const { error } = await apiClient.POST('/api/tenants/{tenantId}/attendance/{employeeId}/clock-in-pin', {
        params: { path: { tenantId, employeeId } },
        body: input,
      });
      if (error) throw error;
    },
  });
}

// --- Kiosk device ---

export function useKioskEmployees(tenantId: string) {
  return useQuery({
    queryKey: ['attendance-kiosk', 'employees', tenantId] as const,
    queryFn: async () => {
      const { data, error } = await apiClient.GET('/api/tenants/{tenantId}/attendance/kiosk', {
        params: { path: { tenantId } },
      });
      if (error) throw error;
      return data;
    },
    // This device sits logged into the same page for weeks at a time with
    // no navigation to trigger react-query's normal refocus/reconnect
    // refetches - a periodic poll is what actually notices the kiosk's
    // session going bad (see KioskApp's redirect-on-401 effect) instead of
    // only finding out the next time someone happens to tap a name.
    refetchInterval: 5 * 60_000,
  });
}

export function useKioskClock(tenantId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: { employeeId: string; pin: string }) => {
      const { data, error } = await apiClient.POST('/api/tenants/{tenantId}/attendance/kiosk/clock', {
        params: { path: { tenantId } },
        body: input,
      });
      if (error) throw error;
      return data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: attendanceRecordsKey(tenantId) }),
  });
}
