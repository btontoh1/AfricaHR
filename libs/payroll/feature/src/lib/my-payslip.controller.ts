import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { assertTenantScope, CurrentUser, JwtAuthGuard, PermissionsGuard, RequestUser } from '@africahr/platform-auth';
import { PayslipService } from './payslip.service';
import { PayslipResponseDto } from './dto/payslip-response.dto';

/**
 * Self-service: no @RequirePermissions on this controller — any
 * authenticated tenant member may view their own payslips regardless of
 * role (PayslipController's PAYROLL_READ gate only covers HR/payroll
 * staff viewing anyone's payslips). PayslipService resolves "own" via
 * Employee.userId and 403s if the caller has no linked Employee record.
 * Registered before PayslipController in the module so this literal
 * "/me" path is matched before that controller's "/:id" route (same
 * gotcha as MyAttendanceController and MyLeaveRequestController).
 */
@ApiTags('payslips')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('tenants/:tenantId/payslips/me')
export class MyPayslipController {
  constructor(private readonly payslips: PayslipService) {}

  @Get()
  @ApiOkResponse({ type: PayslipResponseDto, isArray: true })
  list(@Param('tenantId') tenantId: string, @CurrentUser() actor: RequestUser) {
    assertTenantScope(actor, tenantId);
    return this.payslips.listForSelf(tenantId, actor.sub);
  }

  @Get(':id')
  @ApiOkResponse({ type: PayslipResponseDto })
  findById(
    @Param('tenantId') tenantId: string,
    @Param('id') id: string,
    @CurrentUser() actor: RequestUser,
  ) {
    assertTenantScope(actor, tenantId);
    return this.payslips.findByIdForSelf(tenantId, actor.sub, id);
  }
}
