import { Module } from '@nestjs/common';
import { PlatformAuthModule } from '@africahr/platform-auth';
import { AuditModule } from '@africahr/platform-audit';
import { AppConfigModule } from '@africahr/platform-core';
import { IamDataAccessModule } from '@africahr/iam-data-access';
import { AuthService } from './auth.service';
import { UserService } from './user.service';
import { MfaService } from './mfa.service';
import { AuthController } from './auth.controller';
import { UserController } from './user.controller';
import { MyMfaController } from './my-mfa.controller';

@Module({
  imports: [IamDataAccessModule, PlatformAuthModule, AuditModule, AppConfigModule],
  // "me" controllers must be registered before UserController so Nest's
  // router matches the literal /users/me/... path before UserController's
  // dynamic /users/:id route (same gotcha as every self-service module
  // since Module 5) - though /users/me/mfa/... has an extra segment
  // UserController's own routes never do, so this is defense-in-depth
  // rather than strictly required here.
  controllers: [AuthController, MyMfaController, UserController],
  providers: [AuthService, UserService, MfaService],
  exports: [AuthService, UserService, MfaService],
})
export class IamFeatureModule {}
