import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOkResponse, ApiQuery, ApiTags } from '@nestjs/swagger';
import { AddOnModule } from '@prisma/client';
import {
  AddOnGuard,
  assertTenantScope,
  CurrentUser,
  JwtAuthGuard,
  Permission,
  PermissionsGuard,
  RequestUser,
  RequireAddOn,
  RequirePermissions,
} from '@africahr/platform-auth';
import { VendorBillService } from './vendor-bill.service';
import { CreateVendorBillDto } from './dto/create-vendor-bill.dto';
import { UpdateVendorBillDto } from './dto/update-vendor-bill.dto';
import { UpdateBillStatusDto } from './dto/update-bill-status.dto';
import { VendorBillResponseDto } from './dto/vendor-bill-response.dto';

@ApiTags('vendor-bills')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard, AddOnGuard)
@RequireAddOn(AddOnModule.FINANCE)
@Controller('tenants/:tenantId/vendor-bills')
export class VendorBillController {
  constructor(private readonly bills: VendorBillService) {}

  @Post()
  @RequirePermissions(Permission.AP_MANAGE)
  @ApiOkResponse({ type: VendorBillResponseDto })
  create(@Param('tenantId') tenantId: string, @Body() dto: CreateVendorBillDto, @CurrentUser() actor: RequestUser) {
    assertTenantScope(actor, tenantId);
    return this.bills.create(tenantId, dto, actor);
  }

  @Get()
  @RequirePermissions(Permission.AP_READ)
  @ApiOkResponse({ type: VendorBillResponseDto, isArray: true })
  @ApiQuery({ name: 'organizationId', required: false })
  list(
    @Param('tenantId') tenantId: string,
    @CurrentUser() actor: RequestUser,
    @Query('organizationId') organizationId?: string,
  ) {
    assertTenantScope(actor, tenantId);
    return this.bills.list(tenantId, organizationId, actor);
  }

  @Get(':id')
  @RequirePermissions(Permission.AP_READ)
  @ApiOkResponse({ type: VendorBillResponseDto })
  findById(@Param('tenantId') tenantId: string, @Param('id') id: string, @CurrentUser() actor: RequestUser) {
    assertTenantScope(actor, tenantId);
    return this.bills.findById(tenantId, id, actor);
  }

  @Patch(':id')
  @RequirePermissions(Permission.AP_MANAGE)
  @ApiOkResponse({ type: VendorBillResponseDto })
  update(
    @Param('tenantId') tenantId: string,
    @Param('id') id: string,
    @Body() dto: UpdateVendorBillDto,
    @CurrentUser() actor: RequestUser,
  ) {
    assertTenantScope(actor, tenantId);
    return this.bills.update(tenantId, id, dto, actor);
  }

  @Patch(':id/status')
  @RequirePermissions(Permission.AP_MANAGE)
  @ApiOkResponse({ type: VendorBillResponseDto })
  updateStatus(
    @Param('tenantId') tenantId: string,
    @Param('id') id: string,
    @Body() dto: UpdateBillStatusDto,
    @CurrentUser() actor: RequestUser,
  ) {
    assertTenantScope(actor, tenantId);
    return this.bills.updateStatus(tenantId, id, dto.status, actor);
  }

  @Delete(':id')
  @RequirePermissions(Permission.AP_MANAGE)
  @HttpCode(HttpStatus.NO_CONTENT)
  async softDelete(
    @Param('tenantId') tenantId: string,
    @Param('id') id: string,
    @CurrentUser() actor: RequestUser,
  ): Promise<void> {
    assertTenantScope(actor, tenantId);
    await this.bills.softDelete(tenantId, id, actor);
  }
}
