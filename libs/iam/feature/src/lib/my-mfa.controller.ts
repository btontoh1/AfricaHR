import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiNoContentResponse, ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { CurrentUser, JwtAuthGuard, RequestUser } from '@africahr/platform-auth';
import { MfaService } from './mfa.service';
import { ConfirmMfaDto } from './dto/confirm-mfa.dto';
import { DisableMfaDto } from './dto/disable-mfa.dto';
import { SetupSmsMfaDto } from './dto/setup-sms-mfa.dto';
import { MfaStatusResponseDto } from './dto/mfa-status-response.dto';
import { MfaSetupResponseDto } from './dto/mfa-setup-response.dto';
import { MfaConfirmResponseDto } from './dto/mfa-confirm-response.dto';

/**
 * Self-service: any authenticated user manages their own MFA regardless of
 * role - no @RequirePermissions, same posture as MyPaymentMethodController.
 * Not tenant-nested (mirrors UserController) - identity comes from the
 * actor's own token, not a URL param.
 */
@ApiTags('auth')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('users/me/mfa')
export class MyMfaController {
  constructor(private readonly mfa: MfaService) {}

  @Get('status')
  @ApiOkResponse({ type: MfaStatusResponseDto })
  status(@CurrentUser() actor: RequestUser) {
    return this.mfa.getStatus(actor);
  }

  @Post('setup')
  @ApiOkResponse({ type: MfaSetupResponseDto })
  setup(@CurrentUser() actor: RequestUser) {
    return this.mfa.setup(actor);
  }

  /**
   * Throttled the same as confirm-sms below - a stolen/leaked access token
   * would otherwise get the global default's much higher request budget to
   * brute-force the 6-digit TOTP code, instead of the same tight budget
   * login itself enforces against the very same code.
   */
  @Post('confirm')
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  @ApiOkResponse({ type: MfaConfirmResponseDto })
  confirm(@Body() dto: ConfirmMfaDto, @CurrentUser() actor: RequestUser) {
    return this.mfa.confirm(actor, dto.code);
  }

  /**
   * Throttled unlike setup()/confirm() above - this one triggers a real
   * SMS send (cost + abuse surface), same posture as AuthController's
   * login-adjacent endpoints.
   */
  @Post('setup-sms')
  @HttpCode(HttpStatus.NO_CONTENT)
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  @ApiNoContentResponse()
  async setupSms(@Body() dto: SetupSmsMfaDto, @CurrentUser() actor: RequestUser): Promise<void> {
    await this.mfa.setupSms(actor, dto.phoneNumber);
  }

  @Post('confirm-sms')
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  @ApiOkResponse({ type: MfaConfirmResponseDto })
  confirmSms(@Body() dto: ConfirmMfaDto, @CurrentUser() actor: RequestUser) {
    return this.mfa.confirmSms(actor, dto.code);
  }

  @Post('disable')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiNoContentResponse()
  async disable(@Body() dto: DisableMfaDto, @CurrentUser() actor: RequestUser): Promise<void> {
    await this.mfa.disable(actor, dto.password);
  }

  /**
   * No password required, unlike disable() - forgetting devices only ever
   * makes future logins require the challenge again, never removes it, so
   * there's nothing here to gate behind re-authentication.
   */
  @Delete('trusted-devices')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiNoContentResponse()
  async forgetAllDevices(@CurrentUser() actor: RequestUser): Promise<void> {
    await this.mfa.forgetAllDevices(actor);
  }
}
