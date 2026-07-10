import {
  advanceApplicationFormSchema,
  createApplicationFormSchema,
  createCandidateFormSchema,
  createRequisitionFormSchema,
  linkHiredEmployeeFormSchema,
  sendOfferFormSchema,
} from './recruitment-form-schema';

describe('createRequisitionFormSchema', () => {
  const validInput = {
    organizationId: '123e4567-e89b-42d3-a456-426614174000',
    organizationUnitId: '',
    hiringManagerId: '',
    title: 'Software Engineer',
    description: '',
    employmentType: 'FULL_TIME' as const,
    openings: '1',
    targetHireDate: '',
  };

  it('accepts a valid submission', () => {
    expect(createRequisitionFormSchema.safeParse(validInput).success).toBe(true);
  });

  it('rejects a malformed organizationId', () => {
    expect(
      createRequisitionFormSchema.safeParse({ ...validInput, organizationId: 'not-a-uuid' })
        .success,
    ).toBe(false);
  });

  it('rejects a missing title', () => {
    expect(createRequisitionFormSchema.safeParse({ ...validInput, title: '' }).success).toBe(
      false,
    );
  });
});

describe('createCandidateFormSchema', () => {
  it('accepts a valid submission', () => {
    expect(
      createCandidateFormSchema.safeParse({
        firstName: 'Ada',
        lastName: 'Lovelace',
        email: 'ada@example.com',
        phone: '',
        source: '',
      }).success,
    ).toBe(true);
  });

  it('rejects an invalid email', () => {
    expect(
      createCandidateFormSchema.safeParse({
        firstName: 'Ada',
        lastName: 'Lovelace',
        email: 'not-an-email',
      }).success,
    ).toBe(false);
  });
});

describe('createApplicationFormSchema', () => {
  it('rejects a malformed candidateId', () => {
    expect(
      createApplicationFormSchema.safeParse({
        candidateId: 'not-a-uuid',
        requisitionId: '123e4567-e89b-42d3-a456-426614174000',
      }).success,
    ).toBe(false);
  });
});

describe('advanceApplicationFormSchema', () => {
  it('accepts a non-rejection stage without a reason', () => {
    expect(
      advanceApplicationFormSchema.safeParse({ stage: 'SCREENING', rejectionReason: '', notes: '' })
        .success,
    ).toBe(true);
  });

  it('rejects moving to REJECTED without a reason', () => {
    expect(
      advanceApplicationFormSchema.safeParse({ stage: 'REJECTED', rejectionReason: '', notes: '' })
        .success,
    ).toBe(false);
  });

  it('accepts moving to REJECTED with a reason', () => {
    expect(
      advanceApplicationFormSchema.safeParse({
        stage: 'REJECTED',
        rejectionReason: 'Not a fit',
        notes: '',
      }).success,
    ).toBe(true);
  });
});

describe('sendOfferFormSchema', () => {
  it('rejects a missing offered salary', () => {
    expect(
      sendOfferFormSchema.safeParse({ offeredSalary: '', offeredStartDate: '2026-08-01' })
        .success,
    ).toBe(false);
  });
});

describe('linkHiredEmployeeFormSchema', () => {
  it('rejects a malformed employeeId', () => {
    expect(linkHiredEmployeeFormSchema.safeParse({ employeeId: 'not-a-uuid' }).success).toBe(
      false,
    );
  });
});
