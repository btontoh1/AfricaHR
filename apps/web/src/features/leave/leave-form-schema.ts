import { z } from 'zod';

// Mirrors CreateLeaveRequestDto (libs/leave/feature/src/lib/dto/create-leave-request.dto.ts).
export const leaveRequestFormSchema = z.object({
  leaveTypeId: z.string().uuid('Select a leave type'),
  startDate: z.string().min(1, 'Start date is required'),
  endDate: z.string().min(1, 'End date is required'),
  reason: z.string().max(500).optional().or(z.literal('')),
});

export type LeaveRequestFormValues = z.infer<typeof leaveRequestFormSchema>;

// Mirrors CreateLeaveTypeDto (libs/leave/feature/src/lib/dto/create-leave-type.dto.ts).
export const leaveTypeFormSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100),
  code: z.string().regex(/^[A-Z0-9_]{1,30}$/, 'Uppercase letters, digits, or underscores'),
  isPaid: z.boolean(),
  defaultEntitlementDays: z.string().min(1, 'Entitlement is required'),
});

export type LeaveTypeFormValues = z.infer<typeof leaveTypeFormSchema>;

// Mirrors UpdateLeaveTypeDto (libs/leave/feature/src/lib/dto/update-leave-type.dto.ts) —
// code isn't included since the backend doesn't allow renaming it after creation.
export const editLeaveTypeFormSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100),
  isPaid: z.boolean(),
  defaultEntitlementDays: z.string().min(1, 'Entitlement is required'),
});

export type EditLeaveTypeFormValues = z.infer<typeof editLeaveTypeFormSchema>;

export const rejectLeaveRequestFormSchema = z.object({
  rejectionReason: z.string().min(1, 'A reason is required').max(500),
});

export type RejectLeaveRequestFormValues = z.infer<typeof rejectLeaveRequestFormSchema>;
