import { Module } from '@nestjs/common';
import { PrismaModule } from '@africahr/platform-database';
import { GlAccountRepository } from './gl-account.repository';
import { GlJournalEntryRepository } from './gl-journal-entry.repository';
import { GlPeriodCloseRepository } from './gl-period-close.repository';

@Module({
  imports: [PrismaModule],
  providers: [GlAccountRepository, GlJournalEntryRepository, GlPeriodCloseRepository],
  exports: [GlAccountRepository, GlJournalEntryRepository, GlPeriodCloseRepository],
})
export class FinanceDataAccessModule {}
