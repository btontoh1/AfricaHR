import { Body, Controller, Headers, HttpCode, HttpStatus, Post, Req } from '@nestjs/common';
import { ApiExtraModels, ApiHeader, ApiNoContentResponse, ApiOkResponse, ApiOperation, ApiTags, getSchemaPath } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import type { Request } from 'express';
import { AuthService, RequestContext } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { AuthResponseDto } from './dto/auth-response.dto';
import { MfaChallengeResponseDto } from './dto/mfa-challenge-response.dto';
import { VerifyMfaDto } from './dto/verify-mfa.dto';

// Never accepted anywhere else, and only ever changes whether login()
// issues an MFA challenge - a valid header value alone grants nothing
// without a correct password too. See MfaService.isDeviceTrusted().
export const DEVICE_TOKEN_HEADER = 'x-device-token';

@ApiTags('auth')
@ApiExtraModels(AuthResponseDto, MfaChallengeResponseDto)
@Controller('auth')
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  @ApiOperation({ summary: 'Authenticate with email + password' })
  @ApiHeader({ name: DEVICE_TOKEN_HEADER, required: false, description: 'A remembered device token, if this device was previously trusted' })
  @ApiOkResponse({
    schema: { oneOf: [{ $ref: getSchemaPath(AuthResponseDto) }, { $ref: getSchemaPath(MfaChallengeResponseDto) }] },
  })
  login(
    @Body() dto: LoginDto,
    @Req() req: Request,
    @Headers(DEVICE_TOKEN_HEADER) deviceToken?: string,
  ): Promise<AuthResponseDto | MfaChallengeResponseDto> {
    return this.auth.login(dto, this.requestContext(req), deviceToken);
  }

  @Post('mfa/verify')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  @ApiOperation({ summary: 'Complete login by presenting a challengeToken plus a TOTP or backup code' })
  @ApiOkResponse({ type: AuthResponseDto })
  verifyMfa(@Body() dto: VerifyMfaDto, @Req() req: Request): Promise<AuthResponseDto> {
    return this.auth.verifyMfa(dto.challengeToken, dto.code, this.requestContext(req), dto.rememberDevice);
  }

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  @ApiOperation({ summary: 'Exchange a refresh token for a new token pair (rotates the token)' })
  @ApiOkResponse({ type: AuthResponseDto })
  refresh(@Body() dto: RefreshTokenDto, @Req() req: Request): Promise<AuthResponseDto> {
    return this.auth.refresh(dto.refreshToken, this.requestContext(req));
  }

  @Post('logout')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Revoke a refresh token' })
  @ApiNoContentResponse()
  async logout(@Body() dto: RefreshTokenDto): Promise<void> {
    await this.auth.logout(dto.refreshToken);
  }

  private requestContext(req: Request): RequestContext {
    return { userAgent: req.headers['user-agent'], ipAddress: req.ip };
  }
}
