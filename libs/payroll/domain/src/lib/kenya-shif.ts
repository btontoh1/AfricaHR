import { roundCurrency } from './money';

/**
 * SHIF's minimum monthly contribution (KES 300), per the Social Health
 * Authority's published rate schedule - the 2.75% rate only exceeds this
 * floor above roughly KES 10,909 of gross pay, so anyone earning less
 * still pays the flat minimum rather than a smaller percentage amount.
 */
const SHIF_MINIMUM = 300;

export function calculateKenyaShif(grossPay: number, rate: number): number {
  if (grossPay <= 0) {
    return 0;
  }
  return Math.max(roundCurrency(grossPay * rate), SHIF_MINIMUM);
}
