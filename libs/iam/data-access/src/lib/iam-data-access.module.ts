import { Module } from '@nestjs/common';
import { PrismaModule } from '@africahr/platform-database';
import { UserRepository } from './user.repository';
import { RefreshTokenRepository } from './refresh-token.repository';
import { MfaBackupCodeRepository } from './mfa-backup-code.repository';

@Module({
  imports: [PrismaModule],
  providers: [UserRepository, RefreshTokenRepository, MfaBackupCodeRepository],
  exports: [UserRepository, RefreshTokenRepository, MfaBackupCodeRepository],
})
export class IamDataAccessModule {}
