import type { components } from '@/lib/api-types';

export type NotificationTemplate = components['schemas']['NotificationTemplateResponseDto'];
export type Notification = components['schemas']['NotificationResponseDto'];
export type CreateNotificationTemplateInput = components['schemas']['CreateNotificationTemplateDto'];
export type UpdateNotificationTemplateInput = components['schemas']['UpdateNotificationTemplateDto'];
export type SendNotificationInput = components['schemas']['SendNotificationDto'];
export type SendFromTemplateInput = components['schemas']['SendFromTemplateDto'];
export type NotificationChannel = NotificationTemplate['channel'];
export type NotificationStatus = Notification['status'];
