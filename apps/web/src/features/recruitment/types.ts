import type { components } from '@/lib/api-types';

export type JobRequisition = components['schemas']['JobRequisitionResponseDto'];
export type Candidate = components['schemas']['CandidateResponseDto'];
export type Application = components['schemas']['ApplicationWithRelationsResponseDto'];
export type CreateJobRequisitionInput = components['schemas']['CreateJobRequisitionDto'];
export type UpdateJobRequisitionInput = components['schemas']['UpdateJobRequisitionDto'];
export type CreateCandidateInput = components['schemas']['CreateCandidateDto'];
export type UpdateCandidateInput = components['schemas']['UpdateCandidateDto'];
export type CreateApplicationInput = components['schemas']['CreateApplicationDto'];
export type AdvanceApplicationInput = components['schemas']['AdvanceApplicationDto'];
export type SendOfferInput = components['schemas']['SendOfferDto'];
export type RespondToOfferInput = components['schemas']['RespondToOfferDto'];
export type LinkHiredEmployeeInput = components['schemas']['LinkHiredEmployeeDto'];
export type JobRequisitionStatus = JobRequisition['status'];
export type ApplicationStage = Application['stage'];
export type RecruitmentEmploymentType = JobRequisition['employmentType'];
