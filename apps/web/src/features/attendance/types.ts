import type { components } from '@/lib/api-types';

export type AttendanceRecord = components['schemas']['AttendanceRecordResponseDto'];
export type AttendancePolicy = components['schemas']['AttendancePolicyResponseDto'];
export type CreateAttendanceRecordInput = components['schemas']['CreateAttendanceRecordDto'];
export type UpdateAttendanceRecordInput = components['schemas']['UpdateAttendanceRecordDto'];
export type UpsertAttendancePolicyInput = components['schemas']['UpsertAttendancePolicyDto'];
