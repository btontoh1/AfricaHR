import { z } from 'zod';

const NOTIFICATION_CHANNELS = ['IN_APP', 'EMAIL'] as const;

// Mirrors CreateNotificationTemplateDto.
export const notificationTemplateFormSchema = z.object({
  code: z.string().regex(/^[A-Z0-9_]{1,100}$/, 'Uppercase letters, digits, or underscores'),
  name: z.string().min(1, 'Name is required').max(200),
  channel: z.enum(NOTIFICATION_CHANNELS),
  subjectTemplate: z.string().min(1, 'Subject is required').max(300),
  bodyTemplate: z.string().min(1, 'Body is required').max(5000),
});

export type NotificationTemplateFormValues = z.infer<typeof notificationTemplateFormSchema>;

export const NOTIFICATION_CHANNEL_OPTIONS = NOTIFICATION_CHANNELS;

// Mirrors UpdateNotificationTemplateDto — code and channel aren't included
// since the backend doesn't allow changing them after creation.
export const editNotificationTemplateFormSchema = z.object({
  name: z.string().min(1, 'Name is required').max(200),
  subjectTemplate: z.string().min(1, 'Subject is required').max(300),
  bodyTemplate: z.string().min(1, 'Body is required').max(5000),
});

export type EditNotificationTemplateFormValues = z.infer<typeof editNotificationTemplateFormSchema>;

// Mirrors SendNotificationDto.
export const sendNotificationFormSchema = z.object({
  userId: z.string().uuid('Select a user'),
  channel: z.enum(NOTIFICATION_CHANNELS),
  subject: z.string().min(1, 'Subject is required').max(300),
  body: z.string().min(1, 'Body is required').max(5000),
});

export type SendNotificationFormValues = z.infer<typeof sendNotificationFormSchema>;

// Mirrors SendFromTemplateDto — variables is a dynamic key/value list edited
// with useFieldArray, converted to a Record<string, string> on submit.
export const sendFromTemplateFormSchema = z.object({
  userId: z.string().uuid('Select a user'),
  templateId: z.string().uuid('Select a template'),
  variables: z.array(z.object({ key: z.string(), value: z.string() })),
});

export type SendFromTemplateFormValues = z.infer<typeof sendFromTemplateFormSchema>;
