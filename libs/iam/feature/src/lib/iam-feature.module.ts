import { Module } from '@nestjs/common';
import { PlatformAuthModule } from '@africahr/platform-auth';
import { AuditModule } from '@africahr/platform-audit';
import { IamDataAccessModule } from '@africahr/iam-data-access';
import { AuthService } from './auth.service';
import { UserService } from './user.service';
import { AuthController } from './auth.controller';
import { UserController } from './user.controller';

@Module({
  imports: [IamDataAccessModule, PlatformAuthModule, AuditModule],
  controllers: [AuthController, UserController],
  providers: [AuthService, UserService],
  exports: [AuthService, UserService],
})
export class IamFeatureModule {}
