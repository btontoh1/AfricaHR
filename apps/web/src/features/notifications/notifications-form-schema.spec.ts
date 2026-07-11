import {
  notificationTemplateFormSchema,
  sendFromTemplateFormSchema,
  sendNotificationFormSchema,
} from './notifications-form-schema';

describe('notificationTemplateFormSchema', () => {
  const validInput = {
    code: 'LEAVE_APPROVED',
    name: 'Leave Approved',
    channel: 'EMAIL' as const,
    subjectTemplate: 'Your leave was approved',
    bodyTemplate: 'Hi {{firstName}}, approved.',
  };

  it('accepts a valid submission', () => {
    expect(notificationTemplateFormSchema.safeParse(validInput).success).toBe(true);
  });

  it('rejects a lowercase code', () => {
    expect(
      notificationTemplateFormSchema.safeParse({ ...validInput, code: 'leave_approved' }).success,
    ).toBe(false);
  });
});

describe('sendNotificationFormSchema', () => {
  it('rejects a malformed userId', () => {
    expect(
      sendNotificationFormSchema.safeParse({
        userId: 'not-a-uuid',
        channel: 'IN_APP',
        subject: 'Hi',
        body: 'Hello',
      }).success,
    ).toBe(false);
  });

  it('accepts a valid submission', () => {
    expect(
      sendNotificationFormSchema.safeParse({
        userId: '123e4567-e89b-42d3-a456-426614174000',
        channel: 'IN_APP',
        subject: 'Hi',
        body: 'Hello',
      }).success,
    ).toBe(true);
  });
});

describe('sendFromTemplateFormSchema', () => {
  it('accepts an empty variables list', () => {
    expect(
      sendFromTemplateFormSchema.safeParse({
        userId: '123e4567-e89b-42d3-a456-426614174000',
        templateId: '123e4567-e89b-42d3-a456-426614174001',
        variables: [],
      }).success,
    ).toBe(true);
  });

  it('accepts populated variable rows', () => {
    expect(
      sendFromTemplateFormSchema.safeParse({
        userId: '123e4567-e89b-42d3-a456-426614174000',
        templateId: '123e4567-e89b-42d3-a456-426614174001',
        variables: [{ key: 'firstName', value: 'Ama' }],
      }).success,
    ).toBe(true);
  });
});
