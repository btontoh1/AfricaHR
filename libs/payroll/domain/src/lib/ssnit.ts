import { roundCurrency } from './money';

/**
 * SSNIT Tier 1 employee/employer rates, applied to basic salary only (not
 * gross pay). Rates come from `StatutoryRate` reference data, never
 * hardcoded — see project memory for why (they change with policy, and
 * this models the aggregate Tier 1 split only; Tier 2 trustee routing is a
 * deliberate v1 scope cut).
 */
export interface SsnitRates {
  employeeRate: number;
  employerRate: number;
}

export interface SsnitContribution {
  employee: number;
  employer: number;
}

export function calculateSsnit(basicSalary: number, rates: SsnitRates): SsnitContribution {
  return {
    employee: roundCurrency(basicSalary * rates.employeeRate),
    employer: roundCurrency(basicSalary * rates.employerRate),
  };
}
