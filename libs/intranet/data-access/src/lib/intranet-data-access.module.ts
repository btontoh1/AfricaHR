import { Module } from '@nestjs/common';
import { PrismaModule } from '@africahr/platform-database';
import { PolicyRepository } from './policy.repository';
import { PolicyAcknowledgementRepository } from './policy-acknowledgement.repository';
import { AnnouncementRepository } from './announcement.repository';
import { AnnouncementReadRepository } from './announcement-read.repository';
import { WeeklyReportTemplateRepository } from './weekly-report-template.repository';
import { WeeklyReportRepository } from './weekly-report.repository';
import { WeeklyReportCommentRepository } from './weekly-report-comment.repository';
import { WeeklyReportReminderRepository } from './weekly-report-reminder.repository';
import { IntranetEmployeeRepository } from './intranet-employee.repository';

const PROVIDERS = [
  PolicyRepository,
  PolicyAcknowledgementRepository,
  AnnouncementRepository,
  AnnouncementReadRepository,
  WeeklyReportTemplateRepository,
  WeeklyReportRepository,
  WeeklyReportCommentRepository,
  WeeklyReportReminderRepository,
  IntranetEmployeeRepository,
];

@Module({
  imports: [PrismaModule],
  providers: PROVIDERS,
  exports: PROVIDERS,
})
export class IntranetDataAccessModule {}
