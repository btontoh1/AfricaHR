import { Body, Controller, HttpCode, HttpStatus, Patch, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiNoContentResponse, ApiTags } from '@nestjs/swagger';
import { CurrentUser, JwtAuthGuard, RequestUser } from '@africahr/platform-auth';
import { UserService } from './user.service';
import { ChangePasswordDto } from './dto/change-password.dto';

/**
 * Self-service: any authenticated user changes their own password
 * regardless of role - no @RequirePermissions, same posture as
 * MyMfaController. Not tenant-nested - identity comes from the actor's
 * own token, not a URL param.
 */
@ApiTags('auth')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('users/me/password')
export class MyPasswordController {
  constructor(private readonly users: UserService) {}

  @Patch()
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiNoContentResponse()
  async change(@Body() dto: ChangePasswordDto, @CurrentUser() actor: RequestUser): Promise<void> {
    await this.users.changePassword(actor, dto);
  }
}
