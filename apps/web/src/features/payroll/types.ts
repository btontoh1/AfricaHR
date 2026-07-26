import type { components } from '@/lib/api-types';

export type PayRun = components['schemas']['PayRunResponseDto'];
export type Payslip = components['schemas']['PayslipResponseDto'];
export type PayslipLineItem = components['schemas']['PayslipLineItemResponseDto'];
export type CreatePayRunInput = components['schemas']['CreatePayRunDto'];
export type CreatePayslipLineItemInput = components['schemas']['CreatePayslipLineItemDto'];
export type PayRunStatus = PayRun['status'];
export type PayslipStatus = Payslip['status'];
