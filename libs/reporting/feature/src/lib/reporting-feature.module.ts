import { Module } from '@nestjs/common';
import { PlatformAuthModule } from '@africahr/platform-auth';
import { ReportingDataAccessModule } from '@africahr/reporting-data-access';
import { HeadcountReportService } from './headcount-report.service';
import { HeadcountReportController } from './headcount-report.controller';
import { PayrollCostReportService } from './payroll-cost-report.service';
import { PayrollCostReportController } from './payroll-cost-report.controller';
import { LeaveUtilizationReportService } from './leave-utilization-report.service';
import { LeaveUtilizationReportController } from './leave-utilization-report.controller';
import { AttendanceReportService } from './attendance-report.service';
import { AttendanceReportController } from './attendance-report.controller';
import { RecruitmentPipelineReportService } from './recruitment-pipeline-report.service';
import { RecruitmentPipelineReportController } from './recruitment-pipeline-report.controller';
import { InventoryValuationReportService } from './inventory-valuation-report.service';
import { InventoryValuationReportController } from './inventory-valuation-report.controller';
import { ProcurementSpendReportService } from './procurement-spend-report.service';
import { ProcurementSpendReportController } from './procurement-spend-report.controller';
import { LowStockReportService } from './low-stock-report.service';
import { LowStockReportController } from './low-stock-report.controller';
import { AssetRegisterReportService } from './asset-register-report.service';
import { AssetRegisterReportController } from './asset-register-report.controller';

@Module({
  imports: [ReportingDataAccessModule, PlatformAuthModule],
  // No self-service tier in this module (reports are HR/admin-facing
  // only), so there's no literal-vs-dynamic-path route-ordering concern
  // like every module since Module 5 — each report has one controller at
  // its own fixed path.
  controllers: [
    HeadcountReportController,
    PayrollCostReportController,
    LeaveUtilizationReportController,
    AttendanceReportController,
    RecruitmentPipelineReportController,
    InventoryValuationReportController,
    ProcurementSpendReportController,
    LowStockReportController,
    AssetRegisterReportController,
  ],
  providers: [
    HeadcountReportService,
    PayrollCostReportService,
    LeaveUtilizationReportService,
    AttendanceReportService,
    RecruitmentPipelineReportService,
    InventoryValuationReportService,
    ProcurementSpendReportService,
    LowStockReportService,
    AssetRegisterReportService,
  ],
  exports: [
    HeadcountReportService,
    PayrollCostReportService,
    LeaveUtilizationReportService,
    AttendanceReportService,
    RecruitmentPipelineReportService,
    InventoryValuationReportService,
    ProcurementSpendReportService,
    LowStockReportService,
    AssetRegisterReportService,
  ],
})
export class ReportingFeatureModule {}
