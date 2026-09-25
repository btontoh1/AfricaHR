import type { VendorBillStatus } from './types';

// Mirrors libs/ap/domain/src/lib/vendor-bill-status-transition.ts - kept as a
// small standalone copy since the web app can't import backend libs across
// the deployment boundary. The backend is the source of truth and
// re-validates on every status update; this only drives which buttons the
// UI offers. PARTIALLY_PAID/PAID are deliberately never offered here - the
// backend rejects setting them directly (see VendorBillService.updateStatus)
// since they're only ever reached by recording a payment (see the "Record
// payment" link on the bill detail page instead).
const ALLOWED_TRANSITIONS: Record<VendorBillStatus, VendorBillStatus[]> = {
  DRAFT: ['APPROVED', 'CANCELLED'],
  APPROVED: ['OVERDUE', 'CANCELLED'],
  PARTIALLY_PAID: [],
  OVERDUE: ['CANCELLED'],
  PAID: [],
  CANCELLED: [],
};

export function nextBillStatuses(from: VendorBillStatus): VendorBillStatus[] {
  return ALLOWED_TRANSITIONS[from];
}
