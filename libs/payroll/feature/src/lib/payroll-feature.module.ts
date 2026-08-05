import { Module } from '@nestjs/common';
import { AppConfigModule, AppConfigService } from '@africahr/platform-core';
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
import {
  LogPaystackTransferClient,
  PaystackTransferClient,
  RealPaystackTransferClient,
} from './paystack-transfer-client';
import { PayrollTransferWebhookListener } from './payroll-transfer-webhook.listener';
import { PlatformDisbursementService } from './platform-disbursement.service';
import { PlatformDisbursementController } from './platform-disbursement.controller';

@Module({
  imports: [PayrollDataAccessModule, PlatformAuthModule, AuditModule, AppConfigModule],
  // MyPayslipController must be registered before PayslipController - see
  // that controller's own doc comment for why route order matters here.
  // PlatformDisbursementController (platform-admin/disbursements) has a
  // distinct first segment, so no ordering concern there.
  controllers: [
    StatutoryController,
    PayRunController,
    MyPayslipController,
    PayslipController,
    PlatformDisbursementController,
  ],
  providers: [
    StatutoryDataService,
    PayRunService,
    PayslipService,
    PayrollTransferWebhookListener,
    PlatformDisbursementService,
    {
      provide: PaystackTransferClient,
      inject: [AppConfigService],
      // Real payroll disbursement only when PAYSTACK_SECRET_KEY is set -
      // falls back to the log placeholder otherwise (local/dev/CI), same
      // posture as billing's PaystackClient/NotificationDispatcher.
      useFactory: (config: AppConfigService) => {
        const secretKey = config.paystackSecretKey;
        return secretKey ? new RealPaystackTransferClient(secretKey) : new LogPaystackTransferClient();
      },
    },
  ],
  exports: [StatutoryDataService, PayRunService, PayslipService],
})
export class PayrollFeatureModule {}
