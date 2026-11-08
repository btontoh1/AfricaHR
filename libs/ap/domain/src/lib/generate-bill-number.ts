/**
 * Sequential, per-organization (BILL-0001, BILL-0002, ...) - each
 * organization numbers its own vendor bills independently, same convention
 * as invoicing-domain's generateInvoiceNumber. `nextSequence` is supplied by
 * the caller (VendorBillService derives it from the organization's existing
 * bill count) so this stays a pure formatter with no database access of its
 * own - numbers can have gaps if a draft is later deleted, expected and
 * harmless.
 */
export function generateBillNumber(nextSequence: number): string {
  return `BILL-${String(nextSequence).padStart(4, '0')}`;
}
