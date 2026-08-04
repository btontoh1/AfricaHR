import { sumBenefitContributions } from './benefit-contribution';

describe('sumBenefitContributions', () => {
  it('returns zero totals for no enrollments', () => {
    const result = sumBenefitContributions([], 1000);

    expect(result).toEqual({ employeeTotal: 0, employerTotal: 0 });
  });

  it('computes a PERCENTAGE enrollment as a fraction of basic salary', () => {
    const result = sumBenefitContributions(
      [{ contributionType: 'PERCENTAGE', employeeContribution: 0.02, employerContribution: 0.03 }],
      3000,
    );

    expect(result).toEqual({ employeeTotal: 60, employerTotal: 90 });
  });

  it('computes a FIXED enrollment as a flat amount regardless of basic salary', () => {
    const result = sumBenefitContributions(
      [{ contributionType: 'FIXED', employeeContribution: 50, employerContribution: 100 }],
      3000,
    );

    expect(result).toEqual({ employeeTotal: 50, employerTotal: 100 });
  });

  it('sums multiple enrollments across mixed contribution types', () => {
    const result = sumBenefitContributions(
      [
        { contributionType: 'PERCENTAGE', employeeContribution: 0.02, employerContribution: 0.03 },
        { contributionType: 'FIXED', employeeContribution: 50, employerContribution: 100 },
      ],
      3000,
    );

    expect(result).toEqual({ employeeTotal: 110, employerTotal: 190 });
  });

  it('rounds each enrollment to 2 decimal places before summing', () => {
    const result = sumBenefitContributions(
      [{ contributionType: 'PERCENTAGE', employeeContribution: 0.02, employerContribution: 0.03 }],
      333.33,
    );

    expect(result).toEqual({ employeeTotal: 6.67, employerTotal: 10 });
  });
});
