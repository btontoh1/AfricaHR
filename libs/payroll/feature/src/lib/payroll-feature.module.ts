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
import { MyPayslipController } from './my-payslip.controller';

@Module({
  imports: [PayrollDataAccessModule, PlatformAuthModule, AuditModule],
  // MyPayslipController must be registered before PayslipController - see
  // that controller's own doc comment for why route order matters here.
  controllers: [StatutoryController, PayRunController, MyPayslipController, PayslipController],
  providers: [StatutoryDataService, PayRunService, PayslipService],
  exports: [StatutoryDataService, PayRunService, PayslipService],
})
export class PayrollFeatureModule {}
