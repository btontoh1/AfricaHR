import type { components } from '@/lib/api-types';

export type VendorPayment = components['schemas']['VendorPaymentResponseDto'];
export type VendorPaymentAllocation = components['schemas']['VendorPaymentAllocationResponseDto'];
export type CreateVendorPaymentInput = components['schemas']['CreateVendorPaymentDto'];
export type VendorPaymentAllocationInput = components['schemas']['VendorPaymentAllocationDto'];
export type VendorPaymentMethod = VendorPayment['method'];
