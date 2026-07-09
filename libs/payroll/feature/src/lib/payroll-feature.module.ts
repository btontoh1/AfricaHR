import { Module } from '@nestjs/common';
import { PlatformAuthModule } from '@africahr/platform-auth';
import { AuditModule } from '@africahr/platform-audit';
import { PayrollDataAccessModule } from '@africahr/payroll-data-access';
import { StatutoryDataService } from './statutory-data.service';
import { StatutoryController } from './statutory.controller';
import { PayRunService } from './pay-run.service';
import { PayRunController } from './pay-run.controller';
import { PayslipService } from './payslip.service';
import { PayslipController } from './payslip.controller';

@Module({
  imports: [PayrollDataAccessModule, PlatformAuthModule, AuditModule],
  controllers: [StatutoryController, PayRunController, PayslipController],
  providers: [StatutoryDataService, PayRunService, PayslipService],
  exports: [StatutoryDataService, PayRunService, PayslipService],
})
export class PayrollFeatureModule {}
