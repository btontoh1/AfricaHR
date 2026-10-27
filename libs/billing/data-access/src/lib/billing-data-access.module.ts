import { Module } from '@nestjs/common';
import { PrismaModule } from '@africahr/platform-database';
import { SubscriptionRepository } from './subscription.repository';
import { InvoiceRepository } from './invoice.repository';
import { BillingEmployeeCountRepository } from './billing-employee-count.repository';
import { BillingTenantContactRepository } from './billing-tenant-contact.repository';
import { PlatformBillingRepository } from './platform-billing.repository';
import { PlatformOperatingCostRepository } from './platform-operating-cost.repository';
import { PlatformFinancialInputRepository } from './platform-financial-input.repository';
import { TenantPayrollWalletRepository } from './tenant-payroll-wallet.repository';

@Module({
  imports: [PrismaModule],
  providers: [
    SubscriptionRepository,
    InvoiceRepository,
    BillingEmployeeCountRepository,
    BillingTenantContactRepository,
    PlatformBillingRepository,
    PlatformOperatingCostRepository,
    PlatformFinancialInputRepository,
    TenantPayrollWalletRepository,
  ],
  exports: [
    SubscriptionRepository,
    InvoiceRepository,
    BillingEmployeeCountRepository,
    BillingTenantContactRepository,
    PlatformBillingRepository,
    PlatformOperatingCostRepository,
    PlatformFinancialInputRepository,
    TenantPayrollWalletRepository,
  ],
})
export class BillingDataAccessModule {}
