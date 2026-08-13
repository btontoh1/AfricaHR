import { Module } from '@nestjs/common';
import { PlatformAuthModule } from '@africahr/platform-auth';
import { PrismaModule } from '@africahr/platform-database';
import { HowItWorksVideoService } from './how-it-works-video.service';
import { HowItWorksVideoController } from './how-it-works-video.controller';

@Module({
  imports: [PlatformAuthModule, PrismaModule],
  controllers: [HowItWorksVideoController],
  providers: [HowItWorksVideoService],
})
export class HowItWorksFeatureModule {}
