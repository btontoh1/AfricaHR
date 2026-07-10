import { Module } from '@nestjs/common';
import { PlatformAuthModule } from '@africahr/platform-auth';
import { AuditModule } from '@africahr/platform-audit';
import { NotificationsDataAccessModule } from '@africahr/notifications-data-access';
import { NotificationTemplateService } from './notification-template.service';
import { NotificationTemplateController } from './notification-template.controller';
import { NotificationService } from './notification.service';
import { MyNotificationController } from './my-notification.controller';
import { NotificationController } from './notification.controller';
import { LogNotificationDispatcher, NotificationDispatcher } from './notification-dispatcher';

@Module({
  imports: [NotificationsDataAccessModule, PlatformAuthModule, AuditModule],
  // Literal-path controllers ("/me") must be registered before their
  // sibling dynamic-path controllers ("/:id") so Nest's router matches the
  // literal segment first (same gotcha as every self-service module since
  // Module 5).
  controllers: [
    NotificationTemplateController,
    MyNotificationController,
    NotificationController,
  ],
  providers: [
    NotificationTemplateService,
    NotificationService,
    // PLACEHOLDER: logs instead of sending real email. Replace with a real
    // SMTP/SendGrid/SES-backed provider before any tenant relies on the
    // EMAIL channel (see NotificationDispatcher's own doc comment).
    { provide: NotificationDispatcher, useClass: LogNotificationDispatcher },
  ],
  exports: [NotificationTemplateService, NotificationService],
})
export class NotificationsFeatureModule {}
