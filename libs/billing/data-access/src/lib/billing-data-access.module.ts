import { Module } from '@nestjs/common';
import { PrismaModule } from '@africahr/platform-database';
import { SubscriptionRepository } from './subscription.repository';
import { InvoiceRepository } from './invoice.repository';
import { BillingEmployeeCountRepository } from './billing-employee-count.repository';
import { BillingTenantContactRepository } from './billing-tenant-contact.repository';
import { PlatformBillingRepository } from './platform-billing.repository';
import { PlatformOperatingCostRepository } from './platform-operating-cost.repository';

@Module({
  imports: [PrismaModule],
  providers: [
    SubscriptionRepository,
    InvoiceRepository,
    BillingEmployeeCountRepository,
    BillingTenantContactRepository,
    PlatformBillingRepository,
    PlatformOperatingCostRepository,
  ],
  exports: [
    SubscriptionRepository,
    InvoiceRepository,
    BillingEmployeeCountRepository,
    BillingTenantContactRepository,
    PlatformBillingRepository,
    PlatformOperatingCostRepository,
  ],
})
export class BillingDataAccessModule {}
