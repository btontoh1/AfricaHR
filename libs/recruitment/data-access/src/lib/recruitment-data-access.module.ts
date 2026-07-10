import { Module } from '@nestjs/common';
import { PrismaModule } from '@africahr/platform-database';
import { JobRequisitionRepository } from './job-requisition.repository';
import { CandidateRepository } from './candidate.repository';
import { ApplicationRepository } from './application.repository';
import { RecruitmentEmployeeRepository } from './recruitment-employee.repository';

@Module({
  imports: [PrismaModule],
  providers: [
    JobRequisitionRepository,
    CandidateRepository,
    ApplicationRepository,
    RecruitmentEmployeeRepository,
  ],
  exports: [
    JobRequisitionRepository,
    CandidateRepository,
    ApplicationRepository,
    RecruitmentEmployeeRepository,
  ],
})
export class RecruitmentDataAccessModule {}
