import type { components } from '@/lib/api-types';

export type PerformanceGoal = components['schemas']['PerformanceGoalResponseDto'];
export type ReviewCycle = components['schemas']['ReviewCycleResponseDto'];
export type PerformanceReview = components['schemas']['PerformanceReviewResponseDto'];
export type TeamPerformanceReview = components['schemas']['TeamPerformanceReviewResponseDto'];
export type CreatePerformanceGoalInput = components['schemas']['CreatePerformanceGoalDto'];
export type UpdatePerformanceGoalInput = components['schemas']['UpdatePerformanceGoalDto'];
export type CreateReviewCycleInput = components['schemas']['CreateReviewCycleDto'];
export type UpdateReviewCycleInput = components['schemas']['UpdateReviewCycleDto'];
export type StartReviewForEmployeeInput = components['schemas']['StartReviewForEmployeeDto'];
export type SubmitSelfAssessmentInput = components['schemas']['SubmitSelfAssessmentDto'];
export type SubmitManagerAssessmentInput = components['schemas']['SubmitManagerAssessmentDto'];
export type PerformanceGoalStatus = PerformanceGoal['status'];
export type ReviewCycleStatus = ReviewCycle['status'];
export type PerformanceReviewStatus = PerformanceReview['status'];
