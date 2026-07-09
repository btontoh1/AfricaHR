import { Module } from '@nestjs/common';
import { PrismaModule } from '@africahr/platform-database';
import { UserRepository } from './user.repository';
import { RefreshTokenRepository } from './refresh-token.repository';

@Module({
  imports: [PrismaModule],
  providers: [UserRepository, RefreshTokenRepository],
  exports: [UserRepository, RefreshTokenRepository],
})
export class IamDataAccessModule {}
