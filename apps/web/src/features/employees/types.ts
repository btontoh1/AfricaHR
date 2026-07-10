import type { components } from '@/lib/api-types';

export type Employee = components['schemas']['EmployeeResponseDto'];
export type CreateEmployeeInput = components['schemas']['CreateEmployeeDto'];
export type UpdateEmployeeInput = components['schemas']['UpdateEmployeeDto'];
export type UpdateEmploymentStatusInput = components['schemas']['UpdateEmploymentStatusDto'];
export type EmploymentType = Employee['employmentType'];
export type EmploymentStatus = Employee['employmentStatus'];
