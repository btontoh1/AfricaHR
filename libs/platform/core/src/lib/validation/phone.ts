// Permissive E.164 check (a leading "+" then 8-15 digits, no formatting
// punctuation) rather than a full libphonenumber-style validator - good
// enough to reject obvious garbage before an SMS/WhatsApp provider is ever
// charged for a send attempt, without adding a new dependency for it.
//
// Shared across modules that each need to validate a phone number before
// sending to it (IAM's MFA-by-SMS, employee payslip delivery, ...) - lives
// here in scope:platform since those modules can't depend on each other.
export const E164_PATTERN = /^\+[1-9]\d{7,14}$/;

export function isValidE164PhoneNumber(value: string): boolean {
  return E164_PATTERN.test(value);
}
