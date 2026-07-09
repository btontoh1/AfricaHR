import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
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
import { PayslipService } from './payslip.service';
import { CreatePayslipLineItemDto } from './dto/create-payslip-line-item.dto';

@ApiTags('payslips')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('tenants/:tenantId/payslips')
export class PayslipController {
  constructor(private readonly payslips: PayslipService) {}

  @Get()
  @RequirePermissions(Permission.PAYROLL_READ)
  list(
    @Param('tenantId') tenantId: string,
    @CurrentUser() actor: RequestUser,
    @Query('payRunId') payRunId?: string,
    @Query('employeeId') employeeId?: string,
  ) {
    assertTenantScope(actor, tenantId);
    if (payRunId) {
      return this.payslips.listByPayRun(tenantId, payRunId);
    }
    if (employeeId) {
      return this.payslips.listByEmployee(tenantId, employeeId);
    }
    throw new BadRequestException('Provide either payRunId or employeeId to list payslips');
  }

  @Get(':id')
  @RequirePermissions(Permission.PAYROLL_READ)
  findById(
    @Param('tenantId') tenantId: string,
    @Param('id') id: string,
    @CurrentUser() actor: RequestUser,
  ) {
    assertTenantScope(actor, tenantId);
    return this.payslips.findById(tenantId, id);
  }

  @Post(':id/line-items')
  @RequirePermissions(Permission.PAYROLL_MANAGE)
  addLineItem(
    @Param('tenantId') tenantId: string,
    @Param('id') id: string,
    @Body() dto: CreatePayslipLineItemDto,
    @CurrentUser() actor: RequestUser,
  ) {
    assertTenantScope(actor, tenantId);
    return this.payslips.addLineItem(tenantId, id, dto, actor.sub);
  }

  @Delete(':id/line-items/:lineItemId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @RequirePermissions(Permission.PAYROLL_MANAGE)
  removeLineItem(
    @Param('tenantId') tenantId: string,
    @Param('id') id: string,
    @Param('lineItemId') lineItemId: string,
    @CurrentUser() actor: RequestUser,
  ) {
    assertTenantScope(actor, tenantId);
    return this.payslips.removeLineItem(tenantId, id, lineItemId, actor.sub);
  }
}
