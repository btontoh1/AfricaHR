import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { AppConfigModule, AppConfigService } from '@africahr/platform-core';
import { RedisModule } from '@africahr/platform-redis';
import { JwtTokenService } from './jwt-token.service';
import { JwtAuthGuard } from './jwt-auth.guard';
import { PermissionsGuard } from './permissions.guard';
import { TokenRevocationService } from './token-revocation.service';

@Module({
  imports: [
    AppConfigModule,
    RedisModule,
    JwtModule.registerAsync({
      imports: [AppConfigModule],
      inject: [AppConfigService],
      useFactory: (config: AppConfigService) => {
        if (!config.jwtAccessSecret) {
          throw new Error('JWT_ACCESS_SECRET must be set to use platform-auth');
        }
        // Also required from here on: JwtTokenService signs MFA challenge
        // tokens with this secret (see its own doc comment for why a
        // distinct secret from the access token matters).
        if (!config.jwtRefreshSecret) {
          throw new Error('JWT_REFRESH_SECRET must be set to use platform-auth');
        }
        return { secret: config.jwtAccessSecret };
      },
    }),
  ],
  providers: [JwtTokenService, JwtAuthGuard, PermissionsGuard, TokenRevocationService],
  exports: [JwtTokenService, JwtAuthGuard, PermissionsGuard, TokenRevocationService],
})
export class PlatformAuthModule {}
