import {
  attendanceLocationFormSchema,
  attendancePolicyFormSchema,
  createAttendanceRecordFormSchema,
  updateAttendanceRecordFormSchema,
} from './attendance-form-schema';

describe('createAttendanceRecordFormSchema', () => {
  const validInput = {
    employeeId: '123e4567-e89b-42d3-a456-426614174000',
    date: '2026-07-10',
    clockIn: '',
    clockOut: '',
    notes: '',
  };

  it('accepts a valid submission', () => {
    expect(createAttendanceRecordFormSchema.safeParse(validInput).success).toBe(true);
  });

  it('rejects a malformed employeeId', () => {
    expect(
      createAttendanceRecordFormSchema.safeParse({ ...validInput, employeeId: 'not-a-uuid' })
        .success,
    ).toBe(false);
  });

  it('rejects a missing date', () => {
    expect(createAttendanceRecordFormSchema.safeParse({ ...validInput, date: '' }).success).toBe(
      false,
    );
  });
});

describe('updateAttendanceRecordFormSchema', () => {
  it('accepts an all-optional submission', () => {
    expect(updateAttendanceRecordFormSchema.safeParse({}).success).toBe(true);
  });
});

describe('attendancePolicyFormSchema', () => {
  it('accepts a valid submission', () => {
    expect(attendancePolicyFormSchema.safeParse({ standardDailyHours: '8' }).success).toBe(true);
  });

  it('rejects an empty value', () => {
    expect(attendancePolicyFormSchema.safeParse({ standardDailyHours: '' }).success).toBe(false);
  });
});

describe('attendanceLocationFormSchema', () => {
  const validInput = {
    name: 'East Legon Office',
    latitude: '5.6',
    longitude: '-0.19',
    radiusMeters: '150',
  };

  it('accepts a valid submission', () => {
    expect(attendanceLocationFormSchema.safeParse(validInput).success).toBe(true);
  });

  it('rejects a missing name', () => {
    expect(attendanceLocationFormSchema.safeParse({ ...validInput, name: '' }).success).toBe(false);
  });

  it('rejects a missing latitude', () => {
    expect(attendanceLocationFormSchema.safeParse({ ...validInput, latitude: '' }).success).toBe(false);
  });

  it('rejects a missing radius', () => {
    expect(attendanceLocationFormSchema.safeParse({ ...validInput, radiusMeters: '' }).success).toBe(false);
  });
});
