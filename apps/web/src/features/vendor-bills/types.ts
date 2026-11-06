import type { components } from '@/lib/api-types';

export type VendorBill = components['schemas']['VendorBillResponseDto'];
export type VendorBillLineItem = components['schemas']['VendorBillLineItemResponseDto'];
export type CreateVendorBillInput = components['schemas']['CreateVendorBillDto'];
export type UpdateVendorBillInput = components['schemas']['UpdateVendorBillDto'];
export type BillLineItemInput = components['schemas']['BillLineItemDto'];
export type VendorBillStatus = VendorBill['status'];
