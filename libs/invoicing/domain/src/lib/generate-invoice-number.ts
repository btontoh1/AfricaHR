/**
 * Sequential, per-organization (INV-0001, INV-0002, ...) - each
 * organization numbers its own invoices independently, matching how a
 * standalone small business numbers its own paper trail, not a tenant-wide
 * sequence shared across sibling organizations. `nextSequence` is supplied
 * by the caller (CustomerInvoiceService derives it from the organization's
 * existing invoice count) so this stays a pure formatter with no database
 * access of its own — numbers can have gaps if a draft is later deleted,
 * which is expected and harmless, not something this function tries to
 * prevent.
 */
export function generateInvoiceNumber(nextSequence: number): string {
  return `INV-${String(nextSequence).padStart(4, '0')}`;
}
