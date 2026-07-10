import { BenefitContributionType, computeBenefitContribution } from './contribution';

describe('computeBenefitContribution', () => {
  it('computes PERCENTAGE contributions as a fraction of base salary', () => {
    const result = computeBenefitContribution(
      BenefitContributionType.PERCENTAGE,
      { employeeContribution: 0.02, employerContribution: 0.03 },
      3000,
    );

    expect(result).toEqual({ employee: 60, employer: 90 });
  });

  it('computes FIXED contributions as a flat amount regardless of base salary', () => {
    const result = computeBenefitContribution(
      BenefitContributionType.FIXED,
      { employeeContribution: 50, employerContribution: 100 },
      3000,
    );

    expect(result).toEqual({ employee: 50, employer: 100 });
  });

  it('FIXED contributions are unaffected by base salary changes', () => {
    const low = computeBenefitContribution(
      BenefitContributionType.FIXED,
      { employeeContribution: 50, employerContribution: 100 },
      500,
    );
    const high = computeBenefitContribution(
      BenefitContributionType.FIXED,
      { employeeContribution: 50, employerContribution: 100 },
      50000,
    );

    expect(low).toEqual(high);
  });

  it('rounds to 2 decimal places', () => {
    const result = computeBenefitContribution(
      BenefitContributionType.PERCENTAGE,
      { employeeContribution: 0.055, employerContribution: 0.13 },
      333.33,
    );

    expect(result.employee).toBe(18.33);
    expect(result.employer).toBe(43.33);
  });
});
