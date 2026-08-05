import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard, Permission, PermissionsGuard, RequirePermissions } from '@africahr/platform-auth';
import { PlatformNotificationService } from './platform-notification.service';
import { NotificationDeliveryResponseDto } from './dto/notification-delivery-response.dto';

@ApiTags('notifications')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard)
@RequirePermissions(Permission.PLATFORM_NOTIFICATION_READ)
@Controller('platform-admin/notifications')
export class PlatformNotificationController {
  constructor(private readonly notifications: PlatformNotificationService) {}

  @Get()
  @ApiOperation({ summary: 'Cross-tenant email delivery health for the platform admin dashboard' })
  @ApiOkResponse({ type: NotificationDeliveryResponseDto })
  get() {
    return this.notifications.getDeliverySummary();
  }
}
