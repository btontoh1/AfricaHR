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
import { PaystackTransferClientRegistry } from './paystack-transfer-client-registry';
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
      provide: PaystackTransferClientRegistry,
      inject: [AppConfigService],
      // One PaystackTransferClient per currency/account - Real when that
      // currency's secret key is configured, the log placeholder
      // otherwise (local/dev/CI, or a currency not yet activated), same
      // posture as billing's PaystackClientRegistry/NotificationDispatcher.
      useFactory: (config: AppConfigService) => {
        const keysByCurrency = config.paystackSecretKeysByCurrency;
        const clients = new Map<string, PaystackTransferClient>();
        for (const [currency, secretKey] of Object.entries(keysByCurrency)) {
          clients.set(currency, secretKey ? new RealPaystackTransferClient(secretKey) : new LogPaystackTransferClient());
        }
        return new PaystackTransferClientRegistry(clients);
      },
    },
  ],
  exports: [StatutoryDataService, PayRunService, PayslipService],
})
export class PayrollFeatureModule {}
