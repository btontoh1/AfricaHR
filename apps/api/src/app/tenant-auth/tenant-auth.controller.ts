import { Body, Controller, HttpCode, HttpStatus, Param, Post, Req } from '@nestjs/common';
import { ApiExtraModels, ApiOkResponse, ApiOperation, ApiTags, getSchemaPath } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import type { Request } from 'express';
import { AuthResponseDto, LoginDto, MfaChallengeResponseDto } from '@africahr/iam-feature';
import { TenantAuthService } from './tenant-auth.service';

@ApiTags('auth')
@ApiExtraModels(AuthResponseDto, MfaChallengeResponseDto)
@Controller('tenants/:slug/login')
export class TenantAuthController {
  constructor(private readonly tenantAuth: TenantAuthService) {}

  @Post()
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  @ApiOperation({ summary: 'Authenticate with email + password, scoped to a tenant by slug' })
  @ApiOkResponse({
    schema: { oneOf: [{ $ref: getSchemaPath(AuthResponseDto) }, { $ref: getSchemaPath(MfaChallengeResponseDto) }] },
  })
  login(
    @Param('slug') slug: string,
    @Body() dto: LoginDto,
    @Req() req: Request,
  ): Promise<AuthResponseDto | MfaChallengeResponseDto> {
    return this.tenantAuth.login(slug, dto, {
      userAgent: req.headers['user-agent'],
      ipAddress: req.ip,
    });
  }
}
