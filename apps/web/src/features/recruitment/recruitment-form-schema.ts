import { z } from 'zod';

const EMPLOYMENT_TYPES = ['FULL_TIME', 'PART_TIME', 'CONTRACT', 'INTERN'] as const;
const REQUISITION_STATUSES = ['DRAFT', 'OPEN', 'ON_HOLD', 'CLOSED', 'CANCELLED'] as const;
const APPLICATION_STAGES = [
  'APPLIED',
  'SCREENING',
  'INTERVIEW',
  'OFFER',
  'HIRED',
  'REJECTED',
  'WITHDRAWN',
] as const;

// Mirrors CreateJobRequisitionDto.
export const createRequisitionFormSchema = z.object({
  organizationId: z.string().uuid('Select an organization'),
  organizationUnitId: z.string().optional().or(z.literal('')),
  hiringManagerId: z.string().optional().or(z.literal('')),
  title: z.string().min(1, 'Title is required').max(200),
  description: z.string().max(2000).optional().or(z.literal('')),
  employmentType: z.enum(EMPLOYMENT_TYPES),
  openings: z.string().min(1, 'Openings is required'),
  targetHireDate: z.string().optional().or(z.literal('')),
});

export type CreateRequisitionFormValues = z.infer<typeof createRequisitionFormSchema>;

// Mirrors UpdateJobRequisitionDto — shared by both the HR and hiring-manager
// edit forms, since the backend doesn't restrict which fields either tier
// may change (MyJobRequisitionController.update forwards the same DTO).
export const updateRequisitionFormSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200),
  description: z.string().max(2000).optional().or(z.literal('')),
  organizationUnitId: z.string().optional().or(z.literal('')),
  hiringManagerId: z.string().optional().or(z.literal('')),
  openings: z.string().min(1, 'Openings is required'),
  status: z.enum(REQUISITION_STATUSES),
  targetHireDate: z.string().optional().or(z.literal('')),
});

export type UpdateRequisitionFormValues = z.infer<typeof updateRequisitionFormSchema>;

export const EMPLOYMENT_TYPE_OPTIONS = EMPLOYMENT_TYPES;
export const REQUISITION_STATUS_OPTIONS = REQUISITION_STATUSES;

type RequisitionStatus = (typeof REQUISITION_STATUSES)[number];

// Mirrors canTransitionRequisitionStatus (recruitment-domain) - duplicated
// rather than imported, since the frontend doesn't share the backend's Nx
// project graph. DRAFT opens or is cancelled; OPEN can pause, close, or be
// cancelled; ON_HOLD can resume to OPEN or follow OPEN's same CLOSED/
// CANCELLED paths; CLOSED and CANCELLED are terminal.
const REQUISITION_STATUS_TRANSITIONS: Record<RequisitionStatus, readonly RequisitionStatus[]> = {
  DRAFT: ['OPEN', 'CANCELLED'],
  OPEN: ['ON_HOLD', 'CLOSED', 'CANCELLED'],
  ON_HOLD: ['OPEN', 'CLOSED', 'CANCELLED'],
  CLOSED: [],
  CANCELLED: [],
};

/** The current status plus every status it can legally move to - keeps the form's dropdown from offering a transition the backend will reject. */
export function getAvailableRequisitionStatuses(current: RequisitionStatus): readonly RequisitionStatus[] {
  return [current, ...REQUISITION_STATUS_TRANSITIONS[current]];
}

// Mirrors CreateCandidateDto.
export const createCandidateFormSchema = z.object({
  firstName: z.string().min(1, 'First name is required').max(100),
  lastName: z.string().min(1, 'Last name is required').max(100),
  email: z.string().email('Enter a valid email'),
  phone: z.string().optional().or(z.literal('')),
  source: z.string().max(100).optional().or(z.literal('')),
});

export type CreateCandidateFormValues = z.infer<typeof createCandidateFormSchema>;

// Mirrors UpdateCandidateDto.
export const updateCandidateFormSchema = z.object({
  firstName: z.string().min(1, 'First name is required').max(100),
  lastName: z.string().min(1, 'Last name is required').max(100),
  email: z.string().email('Enter a valid email'),
  phone: z.string().optional().or(z.literal('')),
  source: z.string().max(100).optional().or(z.literal('')),
});

export type UpdateCandidateFormValues = z.infer<typeof updateCandidateFormSchema>;

// Mirrors CreateApplicationDto.
export const createApplicationFormSchema = z.object({
  candidateId: z.string().uuid('Select a candidate'),
  requisitionId: z.string().uuid('Select a requisition'),
});

export type CreateApplicationFormValues = z.infer<typeof createApplicationFormSchema>;

// Mirrors AdvanceApplicationDto — rejectionReason is required only when
// moving to REJECTED, enforced with a refine (the backend enforces the same
// rule server-side; this just gives faster client-side feedback).
export const advanceApplicationFormSchema = z
  .object({
    stage: z.enum(APPLICATION_STAGES),
    rejectionReason: z.string().max(500).optional().or(z.literal('')),
    notes: z.string().max(1000).optional().or(z.literal('')),
  })
  .refine((data) => data.stage !== 'REJECTED' || Boolean(data.rejectionReason), {
    message: 'A reason is required when rejecting an application',
    path: ['rejectionReason'],
  });

export type AdvanceApplicationFormValues = z.infer<typeof advanceApplicationFormSchema>;

export const APPLICATION_STAGE_OPTIONS = APPLICATION_STAGES;

// Mirrors SendOfferDto.
export const sendOfferFormSchema = z.object({
  offeredSalary: z.string().min(1, 'Offered salary is required'),
  offeredStartDate: z.string().min(1, 'Offered start date is required'),
});

export type SendOfferFormValues = z.infer<typeof sendOfferFormSchema>;

// Mirrors LinkHiredEmployeeDto.
export const linkHiredEmployeeFormSchema = z.object({
  employeeId: z.string().uuid('Select an employee'),
});

export type LinkHiredEmployeeFormValues = z.infer<typeof linkHiredEmployeeFormSchema>;
