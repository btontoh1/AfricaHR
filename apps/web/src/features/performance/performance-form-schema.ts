import { z } from 'zod';

const GOAL_STATUSES = ['NOT_STARTED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'] as const;

// Mirrors CreatePerformanceGoalDto.
export const createGoalFormSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200),
  description: z.string().max(1000).optional().or(z.literal('')),
  targetDate: z.string().optional().or(z.literal('')),
});

export type CreateGoalFormValues = z.infer<typeof createGoalFormSchema>;

// Mirrors UpdatePerformanceGoalDto (self-service edit — title/description/
// targetDate/status/progressPercent are all self-managed, no approval step).
export const updateGoalFormSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200),
  description: z.string().max(1000).optional().or(z.literal('')),
  targetDate: z.string().optional().or(z.literal('')),
  status: z.enum(GOAL_STATUSES),
  progressPercent: z.string().min(1, 'Progress is required'),
});

export type UpdateGoalFormValues = z.infer<typeof updateGoalFormSchema>;

export const GOAL_STATUS_OPTIONS = GOAL_STATUSES;

// Mirrors CreateReviewCycleDto.
export const reviewCycleFormSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100),
  startDate: z.string().min(1, 'Start date is required'),
  endDate: z.string().min(1, 'End date is required'),
});

export type ReviewCycleFormValues = z.infer<typeof reviewCycleFormSchema>;

// Mirrors StartReviewDto (self-service) and StartReviewForEmployeeDto (HR).
export const startReviewFormSchema = z.object({
  cycleId: z.string().uuid('Select a review cycle'),
});

export type StartReviewFormValues = z.infer<typeof startReviewFormSchema>;

export const startReviewForEmployeeFormSchema = z.object({
  employeeId: z.string().uuid('Select an employee'),
  cycleId: z.string().uuid('Select a review cycle'),
});

export type StartReviewForEmployeeFormValues = z.infer<typeof startReviewForEmployeeFormSchema>;

// Mirrors SubmitSelfAssessmentDto / SubmitManagerAssessmentDto (same shape).
export const assessmentFormSchema = z.object({
  rating: z.string().min(1, 'Rating is required'),
  comments: z.string().max(2000).optional().or(z.literal('')),
});

export type AssessmentFormValues = z.infer<typeof assessmentFormSchema>;
