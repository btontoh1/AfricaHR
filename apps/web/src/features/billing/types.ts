import type { components } from '@/lib/api-types';

export type Subscription = components['schemas']['SubscriptionResponseDto'];
export type SubscriptionStatus = Subscription['status'];
export type SubscriptionSummary = components['schemas']['SubscriptionSummaryResponseDto'];
export type AssignSubscriptionInput = components['schemas']['AssignSubscriptionDto'];
export type Invoice = components['schemas']['InvoiceResponseDto'];
export type InvoiceStatus = Invoice['status'];
export type PlatformBillingSummary = components['schemas']['PlatformBillingSummaryResponseDto'];
