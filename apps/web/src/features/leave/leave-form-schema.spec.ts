import {
  leaveRequestFormSchema,
  leaveTypeFormSchema,
  rejectLeaveRequestFormSchema,
} from './leave-form-schema';

describe('leaveRequestFormSchema', () => {
  const validInput = {
    leaveTypeId: '123e4567-e89b-42d3-a456-426614174000',
    startDate: '2026-06-08',
    endDate: '2026-06-12',
    reason: '',
  };

  it('accepts a minimal valid submission', () => {
    expect(leaveRequestFormSchema.safeParse(validInput).success).toBe(true);
  });

  it('rejects a malformed leaveTypeId', () => {
    expect(
      leaveRequestFormSchema.safeParse({ ...validInput, leaveTypeId: 'not-a-uuid' }).success,
    ).toBe(false);
  });

  it('rejects a missing start date', () => {
    expect(leaveRequestFormSchema.safeParse({ ...validInput, startDate: '' }).success).toBe(
      false,
    );
  });
});

describe('leaveTypeFormSchema', () => {
  it('accepts a valid submission', () => {
    const result = leaveTypeFormSchema.safeParse({
      name: 'Annual Leave',
      code: 'ANNUAL',
      isPaid: true,
      defaultEntitlementDays: '15',
    });
    expect(result.success).toBe(true);
  });

  it('rejects a lowercase code', () => {
    const result = leaveTypeFormSchema.safeParse({
      name: 'Annual Leave',
      code: 'annual',
      isPaid: true,
      defaultEntitlementDays: '15',
    });
    expect(result.success).toBe(false);
  });
});

describe('rejectLeaveRequestFormSchema', () => {
  it('rejects an empty reason', () => {
    expect(rejectLeaveRequestFormSchema.safeParse({ rejectionReason: '' }).success).toBe(false);
  });

  it('accepts a non-empty reason', () => {
    expect(
      rejectLeaveRequestFormSchema.safeParse({ rejectionReason: 'Insufficient coverage' }).success,
    ).toBe(true);
  });
});
