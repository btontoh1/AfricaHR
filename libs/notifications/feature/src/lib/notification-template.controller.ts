import { Body, Controller, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import {
  assertTenantScope,
  CurrentUser,
  JwtAuthGuard,
  Permission,
  PermissionsGuard,
  RequestUser,
  RequirePermissions,
} from '@africahr/platform-auth';
import { NotificationTemplateService } from './notification-template.service';
import { CreateNotificationTemplateDto } from './dto/create-notification-template.dto';
import { UpdateNotificationTemplateDto } from './dto/update-notification-template.dto';

@ApiTags('notification-templates')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('tenants/:tenantId/notification-templates')
export class NotificationTemplateController {
  constructor(private readonly templates: NotificationTemplateService) {}

  @Get()
  @RequirePermissions(Permission.NOTIFICATIONS_READ)
  list(
    @Param('tenantId') tenantId: string,
    @CurrentUser() actor: RequestUser,
    @Query('activeOnly') activeOnly?: string,
  ) {
    assertTenantScope(actor, tenantId);
    return this.templates.list(tenantId, { activeOnly: activeOnly === 'true' });
  }

  @Get(':id')
  @RequirePermissions(Permission.NOTIFICATIONS_READ)
  findById(
    @Param('tenantId') tenantId: string,
    @Param('id') id: string,
    @CurrentUser() actor: RequestUser,
  ) {
    assertTenantScope(actor, tenantId);
    return this.templates.findById(tenantId, id);
  }

  @Post()
  @RequirePermissions(Permission.NOTIFICATIONS_MANAGE)
  create(
    @Param('tenantId') tenantId: string,
    @Body() dto: CreateNotificationTemplateDto,
    @CurrentUser() actor: RequestUser,
  ) {
    assertTenantScope(actor, tenantId);
    return this.templates.create(tenantId, dto, actor.sub);
  }

  @Patch(':id')
  @RequirePermissions(Permission.NOTIFICATIONS_MANAGE)
  update(
    @Param('tenantId') tenantId: string,
    @Param('id') id: string,
    @Body() dto: UpdateNotificationTemplateDto,
    @CurrentUser() actor: RequestUser,
  ) {
    assertTenantScope(actor, tenantId);
    return this.templates.update(tenantId, id, dto, actor.sub);
  }
}
