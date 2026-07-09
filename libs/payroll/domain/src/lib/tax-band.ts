import { roundCurrency } from './money';

/**
 * A single band of a progressive tax table. `lowerBound`/`upperBound` are
 * absolute taxable-income thresholds (not band widths); `upperBound: null`
 * marks the top, unbounded band. These figures are never hardcoded — they
 * come from `StatutoryTaxBand` reference data (see RLS_CONVENTION.md and
 * project memory), so the calculator below is correct for any country's
 * graduated tax table, not just Ghana's.
 */
export interface TaxBand {
  order: number;
  lowerBound: number;
  upperBound: number | null;
  rate: number;
}

/**
 * Applies a progressive/graduated tax table to `taxableIncome`: each band's
 * rate applies only to the slice of income that falls within that band.
 */
export function calculatePayeTax(taxableIncome: number, bands: readonly TaxBand[]): number {
  if (taxableIncome <= 0) {
    return 0;
  }

  const sortedBands = [...bands].sort((a, b) => a.order - b.order);

  let tax = 0;
  for (const band of sortedBands) {
    if (taxableIncome <= band.lowerBound) {
      continue;
    }
    const upper = band.upperBound ?? Infinity;
    const amountInBand = Math.min(taxableIncome, upper) - band.lowerBound;
    if (amountInBand <= 0) {
      continue;
    }
    tax += amountInBand * band.rate;
  }

  return roundCurrency(tax);
}
