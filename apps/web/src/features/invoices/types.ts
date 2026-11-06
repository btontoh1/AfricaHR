import type { components } from '@/lib/api-types';

export type CustomerInvoice = components['schemas']['CustomerInvoiceResponseDto'];
export type CustomerInvoiceLineItem = components['schemas']['CustomerInvoiceLineItemResponseDto'];
export type CreateCustomerInvoiceInput = components['schemas']['CreateCustomerInvoiceDto'];
export type UpdateCustomerInvoiceInput = components['schemas']['UpdateCustomerInvoiceDto'];
export type InvoiceLineItemInput = components['schemas']['InvoiceLineItemDto'];
export type CustomerInvoiceStatus = CustomerInvoice['status'];
