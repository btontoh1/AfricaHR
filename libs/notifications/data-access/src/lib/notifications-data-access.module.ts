import { Module } from '@nestjs/common';
import { PrismaModule } from '@africahr/platform-database';
import { NotificationTemplateRepository } from './notification-template.repository';
import { NotificationRepository } from './notification.repository';
import { NotificationUserRepository } from './notification-user.repository';

@Module({
  imports: [PrismaModule],
  providers: [NotificationTemplateRepository, NotificationRepository, NotificationUserRepository],
  exports: [NotificationTemplateRepository, NotificationRepository, NotificationUserRepository],
})
export class NotificationsDataAccessModule {}
