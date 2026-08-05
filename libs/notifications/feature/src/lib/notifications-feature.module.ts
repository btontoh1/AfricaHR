import { Module } from '@nestjs/common';
import { AppConfigModule, AppConfigService } from '@africahr/platform-core';
import { PlatformAuthModule } from '@africahr/platform-auth';
import { AuditModule } from '@africahr/platform-audit';
import { NotificationsDataAccessModule } from '@africahr/notifications-data-access';
import { NotificationTemplateService } from './notification-template.service';
import { NotificationTemplateController } from './notification-template.controller';
import { NotificationService } from './notification.service';
import { MyNotificationController } from './my-notification.controller';
import { NotificationController } from './notification.controller';
import { PlatformNotificationService } from './platform-notification.service';
import { PlatformNotificationController } from './platform-notification.controller';
import { LeaveRequestNotificationListener } from './leave-request-notification.listener';
import { LeaveRequestDecidedNotificationListener } from './leave-request-decided-notification.listener';
import { PerformanceReviewNotificationListener } from './performance-review-notification.listener';
import { PerformanceReviewCompletedNotificationListener } from './performance-review-completed-notification.listener';
import { RecruitmentApplicationNotificationListener } from './recruitment-application-notification.listener';
import { RecruitmentApplicationStageChangedNotificationListener } from './recruitment-application-stage-changed-notification.listener';
import { RecruitmentApplicationOfferSentNotificationListener } from './recruitment-application-offer-sent-notification.listener';
import { BenefitEnrollmentNotificationListener } from './benefit-enrollment-notification.listener';
import { BenefitEnrollmentCancelledNotificationListener } from './benefit-enrollment-cancelled-notification.listener';
import { PayRunNotificationListener } from './pay-run-notification.listener';
import { JobRequisitionNotificationListener } from './job-requisition-notification.listener';
import { PayrollDisbursementFailedNotificationListener } from './payroll-disbursement-failed-notification.listener';
import { PayrollDisbursementStuckNotificationListener } from './payroll-disbursement-stuck-notification.listener';
import { AttendanceRecordAdjustedNotificationListener } from './attendance-record-adjusted-notification.listener';
import {
  LogNotificationDispatcher,
  NotificationDispatcher,
  SendGridNotificationDispatcher,
} from './notification-dispatcher';

@Module({
  imports: [NotificationsDataAccessModule, PlatformAuthModule, AuditModule, AppConfigModule],
  // Literal-path controllers ("/me") must be registered before their
  // sibling dynamic-path controllers ("/:id") so Nest's router matches the
  // literal segment first (same gotcha as every self-service module since
  // Module 5). PlatformNotificationController (platform-admin/notifications)
  // has a distinct first segment too, so no ordering concern there.
  controllers: [
    NotificationTemplateController,
    MyNotificationController,
    NotificationController,
    PlatformNotificationController,
  ],
  providers: [
    NotificationTemplateService,
    NotificationService,
    PlatformNotificationService,
    LeaveRequestNotificationListener,
    LeaveRequestDecidedNotificationListener,
    PerformanceReviewNotificationListener,
    PerformanceReviewCompletedNotificationListener,
    RecruitmentApplicationNotificationListener,
    RecruitmentApplicationStageChangedNotificationListener,
    RecruitmentApplicationOfferSentNotificationListener,
    BenefitEnrollmentNotificationListener,
    BenefitEnrollmentCancelledNotificationListener,
    PayRunNotificationListener,
    JobRequisitionNotificationListener,
    PayrollDisbursementFailedNotificationListener,
    PayrollDisbursementStuckNotificationListener,
    AttendanceRecordAdjustedNotificationListener,
    {
      provide: NotificationDispatcher,
      inject: [AppConfigService],
      // Real delivery only when both SENDGRID_API_KEY and
      // SENDGRID_FROM_EMAIL are set - falls back to the log placeholder
      // when neither is set (local/dev/CI), and fails loud on a partial
      // config (likely a forgotten env var, not intentional) rather than
      // silently sending from a blank address.
      useFactory: (config: AppConfigService) => {
        const { apiKey, fromEmail } = config.sendgrid;
        if (apiKey && fromEmail) {
          return new SendGridNotificationDispatcher(apiKey, fromEmail);
        }
        if (apiKey || fromEmail) {
          throw new Error(
            'SENDGRID_API_KEY and SENDGRID_FROM_EMAIL must both be set to enable real email delivery',
          );
        }
        return new LogNotificationDispatcher();
      },
    },
  ],
  exports: [NotificationTemplateService, NotificationService],
})
export class NotificationsFeatureModule {}
