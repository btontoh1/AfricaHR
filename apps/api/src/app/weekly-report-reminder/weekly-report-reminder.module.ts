import { Module } from '@nestjs/common';
import { IntranetDataAccessModule } from '@africahr/intranet-data-access';
import { NotificationsFeatureModule } from '@africahr/notifications-feature';
import { WeeklyReportReminderService } from './weekly-report-reminder.service';

@Module({
  imports: [IntranetDataAccessModule, NotificationsFeatureModule],
  providers: [WeeklyReportReminderService],
})
export class WeeklyReportReminderModule {}
