const NON_BREAKING_SPACE = String.fromCharCode(160);

/**
 * Formats a monetary amount with its ISO 4217 currency code (e.g.
 * "NGN 91,200.00"). Money crosses the API as a Prisma Decimal serialized
 * to a string, so this accepts both. Falls back to a plain 2dp number when
 * no currency code is available, and to a manually-prefixed string if
 * Intl doesn't recognize the code (it throws on unknown ISO 4217 codes
 * rather than degrading gracefully).
 */
export function formatCurrency(
  amount: string | number | null | undefined,
  currencyCode: string | null | undefined,
): string {
  if (amount === null || amount === undefined || amount === '') {
    return '—';
  }
  const numeric = typeof amount === 'string' ? Number(amount) : amount;
  if (Number.isNaN(numeric)) {
    return '—';
  }
  if (!currencyCode) {
    return new Intl.NumberFormat('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(numeric);
  }
  try {
    // Intl inserts U+00A0 (non-breaking space) between an
    // unrecognized-symbol currency code (e.g. "NGN") and the number -
    // normalize to a regular space so the output is predictable to test
    // and to copy-paste.
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currencyCode,
    })
      .format(numeric)
      .split(NON_BREAKING_SPACE)
      .join(' ');
  } catch {
    return `${currencyCode} ${numeric.toFixed(2)}`;
  }
}
