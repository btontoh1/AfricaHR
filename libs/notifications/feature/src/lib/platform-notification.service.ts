import { Injectable } from '@nestjs/common';
import {
  FailedNotification,
  NotificationDeliveryCounts,
  PlatformNotificationRepository,
} from '@africahr/notifications-data-access';

export interface NotificationDeliverySummary {
  counts: NotificationDeliveryCounts;
  failed: FailedNotification[];
}

const RECENT_FAILURES_LIMIT = 20;

/**
 * Platform-admin, cross-tenant view of whether outbound email is actually
 * being delivered - previously this data (Notification.status/
 * failureReason) was recorded per-tenant but never surfaced anywhere the
 * platform admin who owns the SendGrid integration could see it
 * platform-wide.
 */
@Injectable()
export class PlatformNotificationService {
  constructor(private readonly notifications: PlatformNotificationRepository) {}

  async getDeliverySummary(): Promise<NotificationDeliverySummary> {
    const [counts, failed] = await Promise.all([
      this.notifications.getDeliveryCounts(),
      this.notifications.listFailedNotifications(RECENT_FAILURES_LIMIT),
    ]);

    return { counts, failed };
  }
}
