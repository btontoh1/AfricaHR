import type { components } from '@/lib/api-types';

export type Employee = components['schemas']['EmployeeResponseDto'];
export type CreateEmployeeInput = components['schemas']['CreateEmployeeDto'];
export type UpdateEmployeeInput = components['schemas']['UpdateEmployeeDto'];
export type UpdateEmploymentStatusInput = components['schemas']['UpdateEmploymentStatusDto'];
export type EmploymentType = Employee['employmentType'];
export type EmploymentStatus = Employee['employmentStatus'];
export type PaymentMethod = components['schemas']['PaymentMethodResponseDto'];
export type UpsertPaymentMethodInput = components['schemas']['UpsertPaymentMethodDto'];
export type PaymentMethodType = PaymentMethod['type'];
export type BankOption = components['schemas']['BankOptionResponseDto'];
export type BulkImportEmployeesInput = components['schemas']['BulkImportEmployeesDto'];
export type BulkImportResult = components['schemas']['BulkImportResultDto'];
