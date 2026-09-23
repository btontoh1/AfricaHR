import { Module } from '@nestjs/common';
import { PrismaModule } from '@africahr/platform-database';
import { GlAccountRepository } from './gl-account.repository';
import { GlJournalEntryRepository } from './gl-journal-entry.repository';

@Module({
  imports: [PrismaModule],
  providers: [GlAccountRepository, GlJournalEntryRepository],
  exports: [GlAccountRepository, GlJournalEntryRepository],
})
export class FinanceDataAccessModule {}
