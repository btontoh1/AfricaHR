import { Module } from '@nestjs/common';
import { PrismaModule } from '@africahr/platform-database';
import { HeadcountReportRepository } from './headcount-report.repository';
import { PayrollCostReportRepository } from './payroll-cost-report.repository';
import { LeaveUtilizationReportRepository } from './leave-utilization-report.repository';
import { AttendanceReportRepository } from './attendance-report.repository';
import { RecruitmentPipelineReportRepository } from './recruitment-pipeline-report.repository';

@Module({
  imports: [PrismaModule],
  providers: [
    HeadcountReportRepository,
    PayrollCostReportRepository,
    LeaveUtilizationReportRepository,
    AttendanceReportRepository,
    RecruitmentPipelineReportRepository,
  ],
  exports: [
    HeadcountReportRepository,
    PayrollCostReportRepository,
    LeaveUtilizationReportRepository,
    AttendanceReportRepository,
    RecruitmentPipelineReportRepository,
  ],
})
export class ReportingDataAccessModule {}
