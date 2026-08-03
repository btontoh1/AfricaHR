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
import { ApiBearerAuth, ApiOkResponse, ApiQuery, ApiTags } from '@nestjs/swagger';
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
import { PayRunService } from './pay-run.service';
import { CreatePayslipLineItemDto } from './dto/create-payslip-line-item.dto';
import { PayslipResponseDto } from './dto/payslip-response.dto';
import { PayslipLineItemResponseDto } from './dto/payslip-line-item-response.dto';

@ApiTags('payslips')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('tenants/:tenantId/payslips')
export class PayslipController {
  constructor(
    private readonly payslips: PayslipService,
    private readonly payRuns: PayRunService,
  ) {}

  @Get()
  @RequirePermissions(Permission.PAYROLL_READ)
  @ApiOkResponse({ type: PayslipResponseDto, isArray: true })
  @ApiQuery({ name: 'payRunId', required: false })
  @ApiQuery({ name: 'employeeId', required: false })
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
  @ApiOkResponse({ type: PayslipResponseDto })
  findById(
    @Param('tenantId') tenantId: string,
    @Param('id') id: string,
    @CurrentUser() actor: RequestUser,
  ) {
    assertTenantScope(actor, tenantId);
    return this.payslips.findByIdWithPeriod(tenantId, id);
  }

  @Post(':id/line-items')
  @RequirePermissions(Permission.PAYROLL_MANAGE)
  @ApiOkResponse({ type: PayslipLineItemResponseDto })
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

  /** Retries this payslip's disbursement after it FAILED or was skipped (NOT_INITIATED) - e.g. once the employee has corrected their payment method. */
  @Post(':id/retry-disbursement')
  @HttpCode(HttpStatus.NO_CONTENT)
  @RequirePermissions(Permission.PAYROLL_MANAGE)
  async retryDisbursement(
    @Param('tenantId') tenantId: string,
    @Param('id') id: string,
    @CurrentUser() actor: RequestUser,
  ): Promise<void> {
    assertTenantScope(actor, tenantId);
    await this.payRuns.retryDisbursement(tenantId, id, actor.sub);
  }
}
