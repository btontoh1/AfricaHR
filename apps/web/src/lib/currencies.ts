export interface Currency {
  code: string;
  name: string;
  symbol: string;
}

/**
 * Derived from Intl at module load instead of a hand-maintained table, so
 * this covers every ISO 4217 code the runtime knows about (162 as of
 * writing) - including a real currency sign ($, €, ₦, GH₵, ...) - rather
 * than only the handful of currencies this codebase happens to touch today.
 * Falls back to the plain code where no narrow symbol exists (e.g. KES).
 */
export const ALL_CURRENCIES: Currency[] = Intl.supportedValuesOf('currency')
  .map((code) => {
    const parts = new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: code,
      currencyDisplay: 'narrowSymbol',
    }).formatToParts(1);
    const symbol = parts.find((part) => part.type === 'currency')?.value ?? code;
    const name = new Intl.DisplayNames(['en'], { type: 'currency' }).of(code) ?? code;
    return { code, name, symbol };
  })
  .sort((a, b) => a.code.localeCompare(b.code));
