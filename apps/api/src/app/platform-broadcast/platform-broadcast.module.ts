import { Module } from '@nestjs/common';
import { PlatformAuthModule } from '@africahr/platform-auth';
import { IamDataAccessModule } from '@africahr/iam-data-access';
import { NotificationsFeatureModule } from '@africahr/notifications-feature';
import { PlatformBroadcastController } from './platform-broadcast.controller';
import { PlatformBroadcastService } from './platform-broadcast.service';

@Module({
  imports: [PlatformAuthModule, IamDataAccessModule, NotificationsFeatureModule],
  controllers: [PlatformBroadcastController],
  providers: [PlatformBroadcastService],
})
export class PlatformBroadcastModule {}
