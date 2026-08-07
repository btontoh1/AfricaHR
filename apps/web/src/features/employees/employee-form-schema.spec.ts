import { employeeFormSchema } from './employee-form-schema';
import { updateEmployeeFormSchema } from './update-employee-form-schema';

describe('employeeFormSchema', () => {
  const validInput = {
    organizationId: '123e4567-e89b-42d3-a456-426614174000',
    organizationUnitId: '',
    managerId: '',
    employeeNumber: '',
    firstName: 'Kojo',
    lastName: 'Asante',
    dateOfBirth: '',
    gender: '',
    nationality: '',
    phone: '',
    personalEmail: '',
    jobTitle: 'Engineer',
    employmentType: 'FULL_TIME' as const,
    hireDate: '2026-01-01',
    baseSalary: '',
    payFrequency: '',
    currency: '',
    countryCode: 'GH',
  };

  it('accepts a minimal valid submission', () => {
    expect(employeeFormSchema.safeParse(validInput).success).toBe(true);
  });

  it('rejects a malformed organizationId', () => {
    const result = employeeFormSchema.safeParse({ ...validInput, organizationId: 'not-a-uuid' });
    expect(result.success).toBe(false);
  });

  it('rejects a lowercase country code', () => {
    const result = employeeFormSchema.safeParse({ ...validInput, countryCode: 'gh' });
    expect(result.success).toBe(false);
  });

  it('rejects a malformed employee number', () => {
    const result = employeeFormSchema.safeParse({ ...validInput, employeeNumber: 'bad' });
    expect(result.success).toBe(false);
  });

  it('accepts a well-formed employee number', () => {
    const result = employeeFormSchema.safeParse({ ...validInput, employeeNumber: 'EMP-0001' });
    expect(result.success).toBe(true);
  });
});

describe('updateEmployeeFormSchema', () => {
  const validUpdateInput = {
    organizationUnitId: '',
    managerId: '',
    userId: '',
    firstName: 'Kojo',
    lastName: 'Asante',
    dateOfBirth: '',
    gender: '',
    nationality: '',
    phone: '',
    personalEmail: '',
    jobTitle: 'Senior Engineer',
    employmentType: 'FULL_TIME' as const,
    hireDate: '2026-01-01',
    baseSalary: '',
    payFrequency: '',
    annualRentPaid: '',
    countryCode: 'GH',
  };

  it('accepts a minimal valid submission', () => {
    const result = updateEmployeeFormSchema.safeParse(validUpdateInput);
    expect(result.success).toBe(true);
  });

  it('rejects an empty job title', () => {
    const result = updateEmployeeFormSchema.safeParse({ ...validUpdateInput, jobTitle: '' });
    expect(result.success).toBe(false);
  });

  it('rejects an empty first name', () => {
    const result = updateEmployeeFormSchema.safeParse({ ...validUpdateInput, firstName: '' });
    expect(result.success).toBe(false);
  });

  it('rejects a lowercase country code', () => {
    const result = updateEmployeeFormSchema.safeParse({ ...validUpdateInput, countryCode: 'gh' });
    expect(result.success).toBe(false);
  });
});
