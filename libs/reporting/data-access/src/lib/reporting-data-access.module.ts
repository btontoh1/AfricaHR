import { Module } from '@nestjs/common';
import { PrismaModule } from '@africahr/platform-database';
import { HeadcountReportRepository } from './headcount-report.repository';
import { PayrollCostReportRepository } from './payroll-cost-report.repository';
import { LeaveUtilizationReportRepository } from './leave-utilization-report.repository';
import { AttendanceReportRepository } from './attendance-report.repository';
import { RecruitmentPipelineReportRepository } from './recruitment-pipeline-report.repository';
import { InventoryValuationReportRepository } from './inventory-valuation-report.repository';
import { ProcurementSpendReportRepository } from './procurement-spend-report.repository';
import { LowStockReportRepository } from './low-stock-report.repository';
import { AssetRegisterReportRepository } from './asset-register-report.repository';

@Module({
  imports: [PrismaModule],
  providers: [
    HeadcountReportRepository,
    PayrollCostReportRepository,
    LeaveUtilizationReportRepository,
    AttendanceReportRepository,
    RecruitmentPipelineReportRepository,
    InventoryValuationReportRepository,
    ProcurementSpendReportRepository,
    LowStockReportRepository,
    AssetRegisterReportRepository,
  ],
  exports: [
    HeadcountReportRepository,
    PayrollCostReportRepository,
    LeaveUtilizationReportRepository,
    AttendanceReportRepository,
    RecruitmentPipelineReportRepository,
    InventoryValuationReportRepository,
    ProcurementSpendReportRepository,
    LowStockReportRepository,
    AssetRegisterReportRepository,
  ],
})
export class ReportingDataAccessModule {}
