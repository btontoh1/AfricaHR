import { Module } from '@nestjs/common';
import { AppConfigModule, AppConfigService } from '@africahr/platform-core';
import { PlatformAuthModule } from '@africahr/platform-auth';
import { AuditModule } from '@africahr/platform-audit';
import { BillingDataAccessModule } from '@africahr/billing-data-access';
import { SubscriptionService } from './subscription.service';
import { SubscriptionController } from './subscription.controller';
import { InvoiceService } from './invoice.service';
import { InvoiceController } from './invoice.controller';
import { PaystackWebhookController } from './paystack-webhook.controller';
import { PlatformBillingService } from './platform-billing.service';
import { PlatformBillingController } from './platform-billing.controller';
import { PlatformSaasMetricsService } from './platform-saas-metrics.service';
import { PlatformOperatingCostService } from './platform-operating-cost.service';
import { PlatformInvestorMetricsService } from './platform-investor-metrics.service';
import { LogPaystackClient, PaystackClient, RealPaystackClient } from './paystack-client';
import { PaystackClientRegistry } from './paystack-client-registry';
import { TenantPayrollWalletService } from './tenant-payroll-wallet.service';
import { TenantPayrollWalletController } from './tenant-payroll-wallet.controller';

@Module({
  imports: [BillingDataAccessModule, PlatformAuthModule, AuditModule, AppConfigModule],
  controllers: [
    SubscriptionController,
    InvoiceController,
    PaystackWebhookController,
    PlatformBillingController,
    TenantPayrollWalletController,
  ],
  providers: [
    SubscriptionService,
    InvoiceService,
    PlatformBillingService,
    PlatformSaasMetricsService,
    PlatformOperatingCostService,
    PlatformInvestorMetricsService,
    TenantPayrollWalletService,
    {
      provide: PaystackClientRegistry,
      inject: [AppConfigService],
      // One PaystackClient per currency/account - Real when that
      // currency's secret key is configured, the log placeholder
      // otherwise (local/dev/CI, or a currency not yet activated), same
      // posture as NotificationDispatcher/SendGrid. See
      // PaystackClientRegistry's own doc comment.
      useFactory: (config: AppConfigService) => {
        const keysByCurrency = config.paystackSecretKeysByCurrency;
        const clients = new Map<string, PaystackClient>();
        const configuredCurrencies = new Set<string>();
        for (const [currency, secretKey] of Object.entries(keysByCurrency)) {
          clients.set(currency, secretKey ? new RealPaystackClient(secretKey) : new LogPaystackClient());
          if (secretKey) {
            configuredCurrencies.add(currency);
          }
        }
        return new PaystackClientRegistry(clients, configuredCurrencies);
      },
    },
  ],
  exports: [
    SubscriptionService,
    InvoiceService,
    PlatformBillingService,
    PlatformSaasMetricsService,
    PlatformOperatingCostService,
    PlatformInvestorMetricsService,
    TenantPayrollWalletService,
  ],
})
export class BillingFeatureModule {}
