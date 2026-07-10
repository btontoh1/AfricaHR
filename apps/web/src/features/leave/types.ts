import type { components } from '@/lib/api-types';

export type LeaveRequest = components['schemas']['LeaveRequestResponseDto'];
export type LeaveType = components['schemas']['LeaveTypeResponseDto'];
export type CreateLeaveRequestInput = components['schemas']['CreateLeaveRequestDto'];
export type CreateLeaveTypeInput = components['schemas']['CreateLeaveTypeDto'];
export type UpdateLeaveTypeInput = components['schemas']['UpdateLeaveTypeDto'];
export type LeaveRequestStatus = LeaveRequest['status'];
