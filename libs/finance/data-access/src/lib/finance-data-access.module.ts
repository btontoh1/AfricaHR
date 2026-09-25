import { Module } from '@nestjs/common';
import { PrismaModule } from '@africahr/platform-database';
import { GlAccountRepository } from './gl-account.repository';
import { GlJournalEntryRepository } from './gl-journal-entry.repository';
import { GlPeriodCloseRepository } from './gl-period-close.repository';
import { GlBudgetRepository } from './gl-budget.repository';
import { BankReconciliationRepository } from './bank-reconciliation.repository';
import { GlRecurringJournalEntryRepository } from './gl-recurring-journal-entry.repository';
import { GlHomeCurrencyRepository } from './gl-home-currency.repository';
import { GlFxRevaluationRepository } from './gl-fx-revaluation.repository';
import { FinanceOrganizationRepository } from './finance-organization.repository';
import { GlFixedAssetRepository } from './gl-fixed-asset.repository';
import { GlDepreciationRunRepository } from './gl-depreciation-run.repository';
import { ExpenseRepository } from './expense.repository';

@Module({
  imports: [PrismaModule],
  providers: [
    GlAccountRepository,
    GlJournalEntryRepository,
    GlPeriodCloseRepository,
    GlBudgetRepository,
    BankReconciliationRepository,
    GlRecurringJournalEntryRepository,
    GlHomeCurrencyRepository,
    GlFxRevaluationRepository,
    FinanceOrganizationRepository,
    GlFixedAssetRepository,
    GlDepreciationRunRepository,
    ExpenseRepository,
  ],
  exports: [
    GlAccountRepository,
    GlJournalEntryRepository,
    GlPeriodCloseRepository,
    GlBudgetRepository,
    BankReconciliationRepository,
    GlRecurringJournalEntryRepository,
    GlHomeCurrencyRepository,
    GlFxRevaluationRepository,
    FinanceOrganizationRepository,
    GlFixedAssetRepository,
    GlDepreciationRunRepository,
    ExpenseRepository,
  ],
})
export class FinanceDataAccessModule {}
