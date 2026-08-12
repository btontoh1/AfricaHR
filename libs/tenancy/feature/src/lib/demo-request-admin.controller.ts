import { Controller, Get, HttpCode, HttpStatus, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard, Permission, PermissionsGuard, RequirePermissions } from '@africahr/platform-auth';
import { DemoRequestService } from './demo-request.service';
import { DemoRequestAdminResponseDto } from './dto/demo-request-admin-response.dto';

@ApiTags('demo-requests')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard)
@RequirePermissions(Permission.PLATFORM_TENANT_MANAGE)
@Controller('platform-admin/demo-requests')
export class DemoRequestAdminController {
  constructor(private readonly demoRequests: DemoRequestService) {}

  @Get()
  @ApiOperation({ summary: 'List recent "Book a demo" submissions for platform admin follow-up' })
  @ApiOkResponse({ type: DemoRequestAdminResponseDto, isArray: true })
  listRecent(): Promise<DemoRequestAdminResponseDto[]> {
    return this.demoRequests.listRecent();
  }

  @Post('mark-all-viewed')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Mark every unviewed demo request as viewed, clearing the admin notification badge' })
  markAllViewed(): Promise<void> {
    return this.demoRequests.markAllViewed();
  }
}
