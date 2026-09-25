import { Module } from '@nestjs/common';
import { PrismaModule } from '@africahr/platform-database';
import { GlAccountRepository } from './gl-account.repository';
import { GlJournalEntryRepository } from './gl-journal-entry.repository';
import { GlPeriodCloseRepository } from './gl-period-close.repository';
import { GlBudgetRepository } from './gl-budget.repository';
import { BankReconciliationRepository } from './bank-reconciliation.repository';
import { FinanceOrganizationRepository } from './finance-organization.repository';

@Module({
  imports: [PrismaModule],
  providers: [
    GlAccountRepository,
    GlJournalEntryRepository,
    GlPeriodCloseRepository,
    GlBudgetRepository,
    BankReconciliationRepository,
    FinanceOrganizationRepository,
  ],
  exports: [
    GlAccountRepository,
    GlJournalEntryRepository,
    GlPeriodCloseRepository,
    GlBudgetRepository,
    BankReconciliationRepository,
    FinanceOrganizationRepository,
  ],
})
export class FinanceDataAccessModule {}
