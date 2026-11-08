import { Body, Controller, HttpCode, HttpStatus, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser, JwtAuthGuard, Permission, PermissionsGuard, RequestUser, RequirePermissions } from '@africahr/platform-auth';
import { PlatformBroadcastService } from './platform-broadcast.service';
import { BroadcastNotificationDto } from './dto/broadcast-notification.dto';
import { BroadcastResultDto } from './dto/broadcast-result.dto';

@ApiTags('notifications')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard)
@RequirePermissions(Permission.PLATFORM_NOTIFICATION_BROADCAST)
@Controller('platform-admin/notifications/broadcast')
export class PlatformBroadcastController {
  constructor(private readonly broadcast: PlatformBroadcastService) {}

  @Post()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Email + in-app notice to every active tenant's admin at once" })
  @ApiOkResponse({ type: BroadcastResultDto })
  send(@Body() dto: BroadcastNotificationDto, @CurrentUser() actor: RequestUser): Promise<BroadcastResultDto> {
    return this.broadcast.broadcastToTenantAdmins(dto.subject, dto.body, actor);
  }
}
