import { Module } from '@nestjs/common';
import { PrismaModule } from '@africahr/platform-database';
import { GlAccountRepository } from './gl-account.repository';
import { GlJournalEntryRepository } from './gl-journal-entry.repository';
import { GlPeriodCloseRepository } from './gl-period-close.repository';
import { FinanceOrganizationRepository } from './finance-organization.repository';

@Module({
  imports: [PrismaModule],
  providers: [GlAccountRepository, GlJournalEntryRepository, GlPeriodCloseRepository, FinanceOrganizationRepository],
  exports: [GlAccountRepository, GlJournalEntryRepository, GlPeriodCloseRepository, FinanceOrganizationRepository],
})
export class FinanceDataAccessModule {}
