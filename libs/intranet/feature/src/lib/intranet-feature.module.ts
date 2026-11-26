import { Module } from '@nestjs/common';
import { PlatformAuthModule } from '@africahr/platform-auth';
import { AuditModule } from '@africahr/platform-audit';
import { StorageModule } from '@africahr/platform-storage';
import { IntranetDataAccessModule } from '@africahr/intranet-data-access';
import { PolicyService } from './policy.service';
import { MyPolicyController } from './my-policy.controller';
import { PolicyController } from './policy.controller';
import { AnnouncementService } from './announcement.service';
import { MyAnnouncementController } from './my-announcement.controller';
import { AnnouncementController } from './announcement.controller';

@Module({
  imports: [IntranetDataAccessModule, PlatformAuthModule, AuditModule, StorageModule],
  // Each "/me" controller is a literal-path segment that must be registered
  // before its sibling's dynamic "/:id" route, or Nest's router would match
  // "/me" as :id instead - same gotcha as every other self-service module
  // in this app.
  controllers: [MyPolicyController, PolicyController, MyAnnouncementController, AnnouncementController],
  providers: [PolicyService, AnnouncementService],
  exports: [PolicyService, AnnouncementService],
})
export class IntranetFeatureModule {}
