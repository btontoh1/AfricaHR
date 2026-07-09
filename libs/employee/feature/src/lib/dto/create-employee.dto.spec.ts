import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { CreateEmployeeDto } from './create-employee.dto';

async function validateDto(payload: Record<string, unknown>) {
  const dto = plainToInstance(CreateEmployeeDto, payload);
  return validate(dto);
}

describe('CreateEmployeeDto', () => {
  const valid = {
    organizationId: '11111111-1111-4111-8111-111111111111',
    firstName: 'Ama',
    lastName: 'Owusu',
    jobTitle: 'Software Engineer',
    employmentType: 'FULL_TIME',
    hireDate: '2026-01-01',
    countryCode: 'GH',
  };

  it('passes for a minimal valid payload', async () => {
    expect(await validateDto(valid)).toHaveLength(0);
  });

  it('rejects an invalid employmentType', async () => {
    const errors = await validateDto({ ...valid, employmentType: 'FREELANCE' });
    expect(errors.some((e) => e.property === 'employmentType')).toBe(true);
  });

  it('rejects a malformed employeeNumber when explicitly supplied', async () => {
    const errors = await validateDto({ ...valid, employeeNumber: 'not-valid' });
    expect(errors.some((e) => e.property === 'employeeNumber')).toBe(true);
  });

  it('rejects a negative baseSalary', async () => {
    const errors = await validateDto({ ...valid, baseSalary: -100 });
    expect(errors.some((e) => e.property === 'baseSalary')).toBe(true);
  });

  it('rejects a currency code that is not 3 letters', async () => {
    const errors = await validateDto({ ...valid, currency: 'GH' });
    expect(errors.some((e) => e.property === 'currency')).toBe(true);
  });

  it('rejects a missing hireDate', async () => {
    const { hireDate, ...rest } = valid;
    void hireDate;
    const errors = await validateDto(rest);
    expect(errors.some((e) => e.property === 'hireDate')).toBe(true);
  });
});
