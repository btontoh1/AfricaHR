import { organizationFormSchema, organizationUnitFormSchema } from './organization-form-schema';

describe('organizationFormSchema', () => {
  const validInput = {
    legalName: 'Acme Ghana Ltd',
    tradingName: '',
    countryCode: 'GH',
    registrationNumber: 'BN-12345',
    taxIdentificationNumber: '',
  };

  it('accepts a minimal valid submission', () => {
    expect(organizationFormSchema.safeParse(validInput).success).toBe(true);
  });

  it('rejects a lowercase country code', () => {
    expect(organizationFormSchema.safeParse({ ...validInput, countryCode: 'gh' }).success).toBe(
      false,
    );
  });

  it('rejects an empty legal name', () => {
    expect(organizationFormSchema.safeParse({ ...validInput, legalName: '' }).success).toBe(false);
  });

  it('rejects an empty registration number', () => {
    expect(
      organizationFormSchema.safeParse({ ...validInput, registrationNumber: '' }).success,
    ).toBe(false);
  });
});

describe('organizationUnitFormSchema', () => {
  it('accepts a minimal valid submission with no parent', () => {
    const result = organizationUnitFormSchema.safeParse({
      name: 'Human Resources',
      code: 'HR',
      parentId: '',
    });
    expect(result.success).toBe(true);
  });

  it('rejects a malformed parentId', () => {
    const result = organizationUnitFormSchema.safeParse({
      name: 'Human Resources',
      code: 'HR',
      parentId: 'not-a-uuid',
    });
    expect(result.success).toBe(false);
  });
});
