import { Body, Controller, HttpCode, HttpStatus, Param, Post, Req } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import type { Request } from 'express';
import { AuthResponseDto, LoginDto } from '@africahr/iam-feature';
import { TenantAuthService } from './tenant-auth.service';

@ApiTags('auth')
@Controller('tenants/:slug/login')
export class TenantAuthController {
  constructor(private readonly tenantAuth: TenantAuthService) {}

  @Post()
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  @ApiOperation({ summary: 'Authenticate with email + password, scoped to a tenant by slug' })
  @ApiOkResponse({ type: AuthResponseDto })
  login(
    @Param('slug') slug: string,
    @Body() dto: LoginDto,
    @Req() req: Request,
  ): Promise<AuthResponseDto> {
    return this.tenantAuth.login(slug, dto, {
      userAgent: req.headers['user-agent'],
      ipAddress: req.ip,
    });
  }
}
