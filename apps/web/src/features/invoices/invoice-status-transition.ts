import type { CustomerInvoiceStatus } from './types';

// Mirrors libs/invoicing/domain/src/lib/invoice-status-transition.ts - kept
// as a small standalone copy since the web app can't import backend libs
// across the deployment boundary. The backend is the source of truth and
// re-validates on every status update; this only drives which buttons the
// UI offers.
const ALLOWED_TRANSITIONS: Record<CustomerInvoiceStatus, CustomerInvoiceStatus[]> = {
  DRAFT: ['SENT', 'CANCELLED'],
  SENT: ['PAID', 'OVERDUE', 'CANCELLED'],
  OVERDUE: ['PAID', 'CANCELLED'],
  PAID: [],
  CANCELLED: [],
};

export function nextInvoiceStatuses(from: CustomerInvoiceStatus): CustomerInvoiceStatus[] {
  return ALLOWED_TRANSITIONS[from];
}
