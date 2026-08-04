import type { components } from '@/lib/api-types';

export type LeaveRequest = components['schemas']['LeaveRequestResponseDto'];
export type TeamLeaveRequest = components['schemas']['TeamLeaveRequestResponseDto'];
export type LeaveType = components['schemas']['LeaveTypeResponseDto'];
export type LeaveBalance = components['schemas']['LeaveBalanceResponseDto'];
export type CreateLeaveRequestInput = components['schemas']['CreateLeaveRequestDto'];
export type CreateLeaveTypeInput = components['schemas']['CreateLeaveTypeDto'];
export type UpdateLeaveTypeInput = components['schemas']['UpdateLeaveTypeDto'];
export type LeaveRequestStatus = LeaveRequest['status'];
