import { calculateSsnit } from './ssnit';

describe('calculateSsnit', () => {
  it('applies employee and employer rates to basic salary independently', () => {
    const result = calculateSsnit(1000, { employeeRate: 0.055, employerRate: 0.13 });

    expect(result.employee).toBe(55);
    expect(result.employer).toBe(130);
  });

  it('rounds to 2 decimal places', () => {
    const result = calculateSsnit(333.33, { employeeRate: 0.055, employerRate: 0.13 });

    expect(result.employee).toBe(18.33);
    expect(result.employer).toBe(43.33);
  });

  it('returns zero contributions for zero basic salary', () => {
    const result = calculateSsnit(0, { employeeRate: 0.055, employerRate: 0.13 });

    expect(result.employee).toBe(0);
    expect(result.employer).toBe(0);
  });
});
