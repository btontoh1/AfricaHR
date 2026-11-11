import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOkResponse, ApiTags } from '@nestjs/swagger';
import {
  assertTenantScope,
  CurrentUser,
  JwtAuthGuard,
  Permission,
  PermissionsGuard,
  RequestUser,
  RequirePermissions,
} from '@africahr/platform-auth';
import { AttendanceKioskService } from './attendance-kiosk.service';
import { KioskEmployeeResponseDto } from './dto/kiosk-employee-response.dto';
import { KioskClockDto } from './dto/kiosk-clock.dto';
import { KioskClockResponseDto } from './dto/kiosk-clock-response.dto';

/**
 * Hit by the shared kiosk device's own session (SystemRole.KIOSK, holding
 * only Permission.ATTENDANCE_KIOSK_CLOCK) — not by an employee's own
 * session, which has no PIN and no reason to call these. See
 * AttendanceKioskService's doc comment for how this differs from
 * MyAttendanceController's self-service clock-in/out.
 */
@ApiTags('attendance')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('tenants/:tenantId/attendance/kiosk')
export class AttendanceKioskController {
  constructor(private readonly kiosk: AttendanceKioskService) {}

  @Get()
  @RequirePermissions(Permission.ATTENDANCE_KIOSK_CLOCK)
  @ApiOkResponse({ type: KioskEmployeeResponseDto, isArray: true })
  listEmployees(@Param('tenantId') tenantId: string, @CurrentUser() actor: RequestUser) {
    assertTenantScope(actor, tenantId);
    return this.kiosk.listEmployees(tenantId);
  }

  @Post('clock')
  @RequirePermissions(Permission.ATTENDANCE_KIOSK_CLOCK)
  @ApiOkResponse({ type: KioskClockResponseDto })
  clock(
    @Param('tenantId') tenantId: string,
    @Body() dto: KioskClockDto,
    @CurrentUser() actor: RequestUser,
  ) {
    assertTenantScope(actor, tenantId);
    return this.kiosk.clock(tenantId, dto.employeeId, dto.pin);
  }
}
