import { Body, Controller, Headers, HttpCode, HttpStatus, Param, Post, Req } from '@nestjs/common';
import { ApiExtraModels, ApiHeader, ApiOkResponse, ApiOperation, ApiTags, getSchemaPath } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import type { Request } from 'express';
import { AuthResponseDto, DEVICE_TOKEN_HEADER, LoginDto, MfaChallengeResponseDto } from '@africahr/iam-feature';
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
  @ApiHeader({ name: DEVICE_TOKEN_HEADER, required: false, description: 'A remembered device token, if this device was previously trusted' })
  @ApiOkResponse({
    schema: { oneOf: [{ $ref: getSchemaPath(AuthResponseDto) }, { $ref: getSchemaPath(MfaChallengeResponseDto) }] },
  })
  login(
    @Param('slug') slug: string,
    @Body() dto: LoginDto,
    @Req() req: Request,
    @Headers(DEVICE_TOKEN_HEADER) deviceToken?: string,
  ): Promise<AuthResponseDto | MfaChallengeResponseDto> {
    return this.tenantAuth.login(
      slug,
      dto,
      { userAgent: req.headers['user-agent'], ipAddress: req.ip },
      deviceToken,
    );
  }
}
