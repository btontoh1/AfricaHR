import type { VendorBillStatus } from './types';

// Mirrors libs/ap/domain/src/lib/vendor-bill-status-transition.ts - kept as a
// small standalone copy since the web app can't import backend libs across
// the deployment boundary. The backend is the source of truth and
// re-validates on every status update; this only drives which buttons the
// UI offers.
const ALLOWED_TRANSITIONS: Record<VendorBillStatus, VendorBillStatus[]> = {
  DRAFT: ['APPROVED', 'CANCELLED'],
  APPROVED: ['PAID', 'OVERDUE', 'CANCELLED'],
  OVERDUE: ['PAID', 'CANCELLED'],
  PAID: [],
  CANCELLED: [],
};

export function nextBillStatuses(from: VendorBillStatus): VendorBillStatus[] {
  return ALLOWED_TRANSITIONS[from];
}
