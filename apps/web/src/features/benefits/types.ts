import type { components } from '@/lib/api-types';

export type BenefitPlan = components['schemas']['BenefitPlanResponseDto'];
export type BenefitEnrollment = components['schemas']['BenefitEnrollmentWithPlanResponseDto'];
export type BenefitContribution = components['schemas']['BenefitContributionResponseDto'];
export type CreateBenefitPlanInput = components['schemas']['CreateBenefitPlanDto'];
export type UpdateBenefitPlanInput = components['schemas']['UpdateBenefitPlanDto'];
export type CreateBenefitEnrollmentInput = components['schemas']['CreateBenefitEnrollmentDto'];
export type EnrollEmployeeInput = components['schemas']['EnrollEmployeeDto'];
export type BenefitEnrollmentStatus = BenefitEnrollment['status'];
export type BenefitContributionType = BenefitPlan['contributionType'];
