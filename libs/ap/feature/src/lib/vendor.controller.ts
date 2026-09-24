import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
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
import { VendorService } from './vendor.service';
import { CreateVendorDto } from './dto/create-vendor.dto';
import { UpdateVendorDto } from './dto/update-vendor.dto';
import { VendorResponseDto } from './dto/vendor-response.dto';

// AddOnGuard runs after PermissionsGuard - order matters (NestJS runs
// @UseGuards left to right), so a caller without the base role permission
// gets that error rather than a leaked add-on/paywall message.
@ApiTags('vendors')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard, AddOnGuard)
@RequireAddOn(AddOnModule.FINANCE)
@Controller('tenants/:tenantId/vendors')
export class VendorController {
  constructor(private readonly vendors: VendorService) {}

  @Post()
  @RequirePermissions(Permission.AP_MANAGE)
  @ApiOkResponse({ type: VendorResponseDto })
  create(@Param('tenantId') tenantId: string, @Body() dto: CreateVendorDto, @CurrentUser() actor: RequestUser) {
    assertTenantScope(actor, tenantId);
    return this.vendors.create(tenantId, dto, actor);
  }

  @Get()
  @RequirePermissions(Permission.AP_READ)
  @ApiOkResponse({ type: VendorResponseDto, isArray: true })
  @ApiQuery({ name: 'organizationId', required: false })
  list(
    @Param('tenantId') tenantId: string,
    @CurrentUser() actor: RequestUser,
    @Query('organizationId') organizationId?: string,
  ) {
    assertTenantScope(actor, tenantId);
    return this.vendors.list(tenantId, organizationId, actor);
  }

  @Get(':id')
  @RequirePermissions(Permission.AP_READ)
  @ApiOkResponse({ type: VendorResponseDto })
  findById(@Param('tenantId') tenantId: string, @Param('id') id: string, @CurrentUser() actor: RequestUser) {
    assertTenantScope(actor, tenantId);
    return this.vendors.findById(tenantId, id, actor);
  }

  @Patch(':id')
  @RequirePermissions(Permission.AP_MANAGE)
  @ApiOkResponse({ type: VendorResponseDto })
  update(
    @Param('tenantId') tenantId: string,
    @Param('id') id: string,
    @Body() dto: UpdateVendorDto,
    @CurrentUser() actor: RequestUser,
  ) {
    assertTenantScope(actor, tenantId);
    return this.vendors.update(tenantId, id, dto, actor);
  }

  @Delete(':id')
  @RequirePermissions(Permission.AP_MANAGE)
  @ApiOkResponse({ type: VendorResponseDto })
  softDelete(@Param('tenantId') tenantId: string, @Param('id') id: string, @CurrentUser() actor: RequestUser) {
    assertTenantScope(actor, tenantId);
    return this.vendors.softDelete(tenantId, id, actor);
  }
}
