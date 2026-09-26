import type { components } from '@/lib/api-types';

export type Subscription = components['schemas']['SubscriptionResponseDto'];
export type SubscriptionStatus = Subscription['status'];
export type SubscriptionSummary = components['schemas']['SubscriptionSummaryResponseDto'];
export type AssignSubscriptionInput = components['schemas']['AssignSubscriptionDto'];
export type Invoice = components['schemas']['InvoiceResponseDto'];
export type InvoiceStatus = Invoice['status'];
export type PlatformBillingSummary = components['schemas']['PlatformBillingSummaryResponseDto'];
export type PlatformSaasMetrics = components['schemas']['PlatformSaasMetricsResponseDto'];
export type RuleOf40Entry = components['schemas']['RuleOf40ResponseDto'];
export type OperatingCost = components['schemas']['OperatingCostResponseDto'];
export type SetOperatingCostInput = components['schemas']['SetOperatingCostDto'];
