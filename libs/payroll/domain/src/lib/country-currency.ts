/**
 * ISO 4217 currency for each country this platform currently has statutory
 * payroll data for. Used only as a fallback when an employee record has no
 * explicit `currency` set - a fixed reference mapping (not a rate that
 * changes with policy), so it's code, not seeded data, same reasoning as
 * the SSNIT deduction ordering in payslip-calculator.ts.
 */
const COUNTRY_CURRENCY: Record<string, string> = {
  GH: 'GHS',
  NG: 'NGN',
};

/**
 * Falls back to the country's own currency rather than hardcoding one -
 * the bug this replaces silently mislabeled every payslip generated for
 * an employee with no explicit currency as GHS, regardless of country.
 * Throws for an unmapped country rather than guessing, matching the
 * project's "fail loud on missing statutory config" posture elsewhere.
 */
export function getDefaultCurrencyForCountry(countryCode: string): string {
  const currency = COUNTRY_CURRENCY[countryCode];
  if (!currency) {
    throw new Error(`No default currency configured for country "${countryCode}"`);
  }
  return currency;
}
