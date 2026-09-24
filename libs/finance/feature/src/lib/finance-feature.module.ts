import { Module } from '@nestjs/common';
import { PlatformAuthModule } from '@africahr/platform-auth';
import { AuditModule } from '@africahr/platform-audit';
import { FinanceDataAccessModule } from '@africahr/finance-data-access';
import { FinanceService } from './finance.service';
import { FinanceReportsService } from './finance-reports.service';
import { FinanceReportPdfService } from './finance-report-pdf.service';
import { FinanceController } from './finance.controller';
import { PayrollGlPostingListener } from './payroll-gl-posting.listener';
import { InvoicingGlPostingListener } from './invoicing-gl-posting.listener';

@Module({
  imports: [FinanceDataAccessModule, PlatformAuthModule, AuditModule],
  controllers: [FinanceController],
  providers: [
    FinanceService,
    FinanceReportsService,
    FinanceReportPdfService,
    PayrollGlPostingListener,
    InvoicingGlPostingListener,
  ],
  exports: [FinanceService, FinanceReportsService],
})
export class FinanceFeatureModule {}
