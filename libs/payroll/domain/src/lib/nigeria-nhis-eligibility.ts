/**
 * NHIA's Organized Private Sector Social Health Insurance Programme
 * (OPSSHIP) requires an employee's basic monthly salary to be at least
 * NGN 30,000 to qualify - per public NHIA guidance, not otherwise
 * confirmed against nhia.gov.ng directly (blocked by this environment's
 * egress policy).
 */
const NHIS_MINIMUM_BASIC_SALARY = 30_000;

export function isEligibleForNigeriaNhis(basicSalary: number): boolean {
  return basicSalary >= NHIS_MINIMUM_BASIC_SALARY;
}
