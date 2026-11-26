import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { NotificationChannel } from '@prisma/client';
import { getWeekStart } from '@africahr/intranet-domain';
import { EmployeeMissingWeeklyReport, WeeklyReportReminderRepository } from '@africahr/intranet-data-access';
import { NotificationService } from '@africahr/notifications-feature';

/**
 * "A reminder goes out near the end of the week" per the intranet project
 * plan. Lives at the app level, not in intranet-feature or
 * notifications-feature, because those libs' scope:intranet/
 * scope:notifications Nx tags can't depend on each other directly - same
 * reasoning as PlatformBroadcastService.
 */
@Injectable()
export class WeeklyReportReminderService {
  private readonly logger = new Logger(WeeklyReportReminderService.name);

  constructor(
    private readonly reminders: WeeklyReportReminderRepository,
    private readonly notifications: NotificationService,
  ) {}

  @Cron('0 9 * * 5')
  async sendReminders(): Promise<void> {
    const weekStart = getWeekStart(new Date());
    let missing: EmployeeMissingWeeklyReport[];
    try {
      missing = await this.reminders.findEmployeesMissingReport(weekStart);
    } catch (error) {
      this.logger.error('Failed to list employees missing a weekly report', error as Error);
      return;
    }

    for (const employee of missing) {
      try {
        await this.notifications.send(employee.tenantId, {
          userId: employee.userId,
          channel: NotificationChannel.IN_APP,
          subject: 'Weekly report reminder',
          body: `Hi ${employee.firstName}, don't forget to submit your weekly report before the week ends.`,
          linkPath: '/intranet/my-weekly-reports',
        });
      } catch (error) {
        this.logger.error(`Failed to send weekly report reminder to user "${employee.userId}"`, error as Error);
      }
    }
  }
}
