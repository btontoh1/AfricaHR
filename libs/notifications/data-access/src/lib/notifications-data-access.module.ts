import { Module } from '@nestjs/common';
import { PrismaModule } from '@africahr/platform-database';
import { NotificationTemplateRepository } from './notification-template.repository';
import { NotificationRepository } from './notification.repository';
import { NotificationUserRepository } from './notification-user.repository';
import { PlatformNotificationRepository } from './platform-notification.repository';

@Module({
  imports: [PrismaModule],
  providers: [
    NotificationTemplateRepository,
    NotificationRepository,
    NotificationUserRepository,
    PlatformNotificationRepository,
  ],
  exports: [
    NotificationTemplateRepository,
    NotificationRepository,
    NotificationUserRepository,
    PlatformNotificationRepository,
  ],
})
export class NotificationsDataAccessModule {}
