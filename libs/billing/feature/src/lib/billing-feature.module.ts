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
import { LogPaystackClient, PaystackClient, RealPaystackClient } from './paystack-client';

@Module({
  imports: [BillingDataAccessModule, PlatformAuthModule, AuditModule, AppConfigModule],
  controllers: [
    SubscriptionController,
    InvoiceController,
    PaystackWebhookController,
    PlatformBillingController,
  ],
  providers: [
    SubscriptionService,
    InvoiceService,
    PlatformBillingService,
    {
      provide: PaystackClient,
      inject: [AppConfigService],
      // Real payment collection only when PAYSTACK_SECRET_KEY is set -
      // falls back to the log placeholder otherwise (local/dev/CI), same
      // posture as NotificationDispatcher/SendGrid.
      useFactory: (config: AppConfigService) => {
        const secretKey = config.paystackSecretKey;
        return secretKey ? new RealPaystackClient(secretKey) : new LogPaystackClient();
      },
    },
  ],
  exports: [SubscriptionService, InvoiceService, PlatformBillingService],
})
export class BillingFeatureModule {}
