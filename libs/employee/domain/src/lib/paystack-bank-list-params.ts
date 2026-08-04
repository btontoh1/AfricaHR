/**
 * Maps (countryCode, payment-method type) to the query params Paystack's
 * "List Banks" endpoint expects (GET /bank?country=...&type=...) - used
 * to populate the bank/provider picker on the self-service payment-method
 * form. Deliberately not imported from payroll-domain's
 * resolvePaystackRecipientType (same mapping, different API surface -
 * List Banks vs Create Transfer Recipient use the same `type` values):
 * scope:employee cannot depend on scope:payroll (Nx module boundary), so
 * this is a small, intentional duplication of that logic rather than a
 * cross-boundary import.
 */
export function resolvePaystackBankListParams(
  countryCode: string,
  paymentMethodType: 'BANK_ACCOUNT' | 'MOBILE_MONEY',
): { country: string; type?: string } | null {
  if (countryCode === 'GH') {
    return paymentMethodType === 'BANK_ACCOUNT'
      ? { country: 'ghana', type: 'ghipss' }
      : { country: 'ghana', type: 'mobile_money' };
  }
  if (countryCode === 'NG') {
    return paymentMethodType === 'BANK_ACCOUNT' ? { country: 'nigeria' } : null;
  }
  if (countryCode === 'KE') {
    // Inverse of Nigeria: Paystack only supports mobile money (M-PESA) in
    // Kenya - no bank-account recipient type, so no List Banks call for it.
    return paymentMethodType === 'MOBILE_MONEY' ? { country: 'kenya', type: 'mobile_money' } : null;
  }
  return null;
}
