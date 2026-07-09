import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { AppConfigModule, AppConfigService } from '@africahr/platform-core';
import { JwtTokenService } from './jwt-token.service';
import { JwtAuthGuard } from './jwt-auth.guard';
import { PermissionsGuard } from './permissions.guard';

@Module({
  imports: [
    AppConfigModule,
    JwtModule.registerAsync({
      imports: [AppConfigModule],
      inject: [AppConfigService],
      useFactory: (config: AppConfigService) => {
        if (!config.jwtAccessSecret) {
          throw new Error('JWT_ACCESS_SECRET must be set to use platform-auth');
        }
        return { secret: config.jwtAccessSecret };
      },
    }),
  ],
  providers: [JwtTokenService, JwtAuthGuard, PermissionsGuard],
  exports: [JwtTokenService, JwtAuthGuard, PermissionsGuard],
})
export class PlatformAuthModule {}
