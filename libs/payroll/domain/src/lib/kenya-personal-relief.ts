/**
 * Kenya's resident personal relief (Income Tax Act s.30, effective 1 July
 * 2023 per Finance Act 2023) - a flat KES 2,400/month subtracted from the
 * PAYE bands' output, not from taxable income like Nigeria's Rent Relief
 * Allowance. Every resident taxpayer gets it regardless of income, so it's
 * unconditional here (contrast Nigeria's relief, which depends on
 * annualRentPaid being set). Floored at zero - relief can't turn into a
 * refund.
 */
const KENYA_PERSONAL_RELIEF = 2_400;

export function applyKenyaPersonalRelief(payeTax: number): number {
  return Math.max(0, payeTax - KENYA_PERSONAL_RELIEF);
}
