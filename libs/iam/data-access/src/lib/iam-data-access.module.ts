import { Module } from '@nestjs/common';
import { PrismaModule } from '@africahr/platform-database';
import { UserRepository } from './user.repository';
import { RefreshTokenRepository } from './refresh-token.repository';
import { MfaBackupCodeRepository } from './mfa-backup-code.repository';
import { MfaTrustedDeviceRepository } from './mfa-trusted-device.repository';

@Module({
  imports: [PrismaModule],
  providers: [UserRepository, RefreshTokenRepository, MfaBackupCodeRepository, MfaTrustedDeviceRepository],
  exports: [UserRepository, RefreshTokenRepository, MfaBackupCodeRepository, MfaTrustedDeviceRepository],
})
export class IamDataAccessModule {}
