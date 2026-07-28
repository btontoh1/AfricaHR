import { Body, Controller, Get, HttpCode, HttpStatus, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiNoContentResponse, ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { CurrentUser, JwtAuthGuard, RequestUser } from '@africahr/platform-auth';
import { MfaService } from './mfa.service';
import { ConfirmMfaDto } from './dto/confirm-mfa.dto';
import { DisableMfaDto } from './dto/disable-mfa.dto';
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

  @Post('confirm')
  @ApiOkResponse({ type: MfaConfirmResponseDto })
  confirm(@Body() dto: ConfirmMfaDto, @CurrentUser() actor: RequestUser) {
    return this.mfa.confirm(actor, dto.code);
  }

  @Post('disable')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiNoContentResponse()
  async disable(@Body() dto: DisableMfaDto, @CurrentUser() actor: RequestUser): Promise<void> {
    await this.mfa.disable(actor, dto.password);
  }
}
