import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { AppConfigModule, AppConfigService } from '@africahr/platform-core';
import { RedisModule } from '@africahr/platform-redis';
import { PrismaModule } from '@africahr/platform-database';
import { JwtTokenService } from './jwt-token.service';
import { JwtAuthGuard } from './jwt-auth.guard';
import { PermissionsGuard } from './permissions.guard';
import { AddOnGuard } from './add-on.guard';
import { TokenRevocationService } from './token-revocation.service';

@Module({
  imports: [
    AppConfigModule,
    RedisModule,
    PrismaModule,
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
        // Pinned so a token signed (or forged) with a different algorithm -
        // most notably `none`, or an RS256 token replayed against this
        // HMAC secret - is rejected outright rather than relying on the
        // library's own default behavior. Applies to every sign()/verify()
        // call in JwtTokenService, including the MFA challenge token's
        // explicit secret override: JwtService only shallow-merges each
        // call's own options over these, so a call that doesn't specify its
        // own algorithm still inherits this one.
        return {
          secret: config.jwtAccessSecret,
          signOptions: { algorithm: 'HS256' },
          verifyOptions: { algorithms: ['HS256'] },
        };
      },
    }),
  ],
  providers: [JwtTokenService, JwtAuthGuard, PermissionsGuard, AddOnGuard, TokenRevocationService],
  exports: [JwtTokenService, JwtAuthGuard, PermissionsGuard, AddOnGuard, TokenRevocationService],
})
export class PlatformAuthModule {}
