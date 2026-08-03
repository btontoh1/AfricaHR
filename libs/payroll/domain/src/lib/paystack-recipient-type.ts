/**
 * Maps (countryCode, payout method) to the `type` Paystack's "Create
 * Transfer Recipient" endpoint expects - a different value per country's
 * banking rail, not the free-text bankName/mobileMoneyProvider an
 * employee enters. Returns null for a combination Paystack Transfers
 * doesn't support (e.g. Nigerian mobile money - Paystack NG only
 * supports NUBAN bank transfers), so the caller can skip that employee's
 * disbursement rather than send Paystack a request it will reject.
 */
export function resolvePaystackRecipientType(
  countryCode: string,
  paymentMethodType: 'BANK_ACCOUNT' | 'MOBILE_MONEY',
): string | null {
  if (countryCode === 'GH') {
    return paymentMethodType === 'BANK_ACCOUNT' ? 'ghipss' : 'mobile_money';
  }
  if (countryCode === 'NG') {
    return paymentMethodType === 'BANK_ACCOUNT' ? 'nuban' : null;
  }
  return null;
}
