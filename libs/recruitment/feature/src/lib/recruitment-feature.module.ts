import { Module } from '@nestjs/common';
import { PlatformAuthModule } from '@africahr/platform-auth';
import { AuditModule } from '@africahr/platform-audit';
import { RecruitmentDataAccessModule } from '@africahr/recruitment-data-access';
import { JobRequisitionService } from './job-requisition.service';
import { MyJobRequisitionController } from './my-job-requisition.controller';
import { JobRequisitionController } from './job-requisition.controller';
import { CandidateService } from './candidate.service';
import { CandidateController } from './candidate.controller';
import { ApplicationService } from './application.service';
import { MyApplicationController } from './my-application.controller';
import { ApplicationController } from './application.controller';

@Module({
  imports: [RecruitmentDataAccessModule, PlatformAuthModule, AuditModule],
  // Literal-path controllers ("/mine") must be registered before their
  // sibling dynamic-path controllers ("/:id") so Nest's router matches the
  // literal segment first (same gotcha as Modules 5-8).
  controllers: [
    MyJobRequisitionController,
    JobRequisitionController,
    CandidateController,
    MyApplicationController,
    ApplicationController,
  ],
  providers: [JobRequisitionService, CandidateService, ApplicationService],
  exports: [JobRequisitionService, CandidateService, ApplicationService],
})
export class RecruitmentFeatureModule {}
