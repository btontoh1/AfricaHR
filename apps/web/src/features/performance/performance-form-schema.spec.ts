import {
  assessmentFormSchema,
  createGoalFormSchema,
  reviewCycleFormSchema,
  startReviewForEmployeeFormSchema,
  startReviewFormSchema,
  updateGoalFormSchema,
} from './performance-form-schema';

describe('createGoalFormSchema', () => {
  it('accepts a valid submission', () => {
    expect(
      createGoalFormSchema.safeParse({
        title: 'Ship the Q1 roadmap',
        description: '',
        targetDate: '',
      }).success,
    ).toBe(true);
  });

  it('rejects a missing title', () => {
    expect(
      createGoalFormSchema.safeParse({ title: '', description: '', targetDate: '' }).success,
    ).toBe(false);
  });
});

describe('updateGoalFormSchema', () => {
  it('accepts a valid submission', () => {
    expect(
      updateGoalFormSchema.safeParse({
        title: 'Ship the Q1 roadmap',
        description: '',
        targetDate: '',
        status: 'IN_PROGRESS',
        progressPercent: '50',
      }).success,
    ).toBe(true);
  });

  it('rejects an invalid status', () => {
    expect(
      updateGoalFormSchema.safeParse({
        title: 'Ship the Q1 roadmap',
        status: 'BOGUS',
        progressPercent: '50',
      }).success,
    ).toBe(false);
  });
});

describe('reviewCycleFormSchema', () => {
  it('accepts a valid submission', () => {
    expect(
      reviewCycleFormSchema.safeParse({
        name: 'Q1 2026 Review',
        startDate: '2026-01-01',
        endDate: '2026-03-31',
      }).success,
    ).toBe(true);
  });

  it('rejects a missing name', () => {
    expect(
      reviewCycleFormSchema.safeParse({ name: '', startDate: '2026-01-01', endDate: '2026-03-31' })
        .success,
    ).toBe(false);
  });
});

describe('startReviewFormSchema / startReviewForEmployeeFormSchema', () => {
  it('accepts a valid cycle selection', () => {
    expect(
      startReviewFormSchema.safeParse({ cycleId: '123e4567-e89b-42d3-a456-426614174000' })
        .success,
    ).toBe(true);
  });

  it('rejects a malformed employeeId', () => {
    expect(
      startReviewForEmployeeFormSchema.safeParse({
        employeeId: 'not-a-uuid',
        cycleId: '123e4567-e89b-42d3-a456-426614174000',
      }).success,
    ).toBe(false);
  });
});

describe('assessmentFormSchema', () => {
  it('accepts a valid rating', () => {
    expect(assessmentFormSchema.safeParse({ rating: '4', comments: '' }).success).toBe(true);
  });

  it('rejects an empty rating', () => {
    expect(assessmentFormSchema.safeParse({ rating: '', comments: '' }).success).toBe(false);
  });
});
