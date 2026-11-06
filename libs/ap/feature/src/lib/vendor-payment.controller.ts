import { Body, Controller, Get, Param, Post, Query, UseGuards } from '@nestjs/common';
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
import { VendorPaymentService } from './vendor-payment.service';
import { CreateVendorPaymentDto } from './dto/create-vendor-payment.dto';
import { VendorPaymentResponseDto } from './dto/vendor-payment-response.dto';

@ApiTags('vendor-payments')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard, AddOnGuard)
@RequireAddOn(AddOnModule.FINANCE)
@Controller('tenants/:tenantId/vendor-payments')
export class VendorPaymentController {
  constructor(private readonly payments: VendorPaymentService) {}

  @Post()
  @RequirePermissions(Permission.AP_MANAGE)
  @ApiOkResponse({ type: VendorPaymentResponseDto })
  create(@Param('tenantId') tenantId: string, @Body() dto: CreateVendorPaymentDto, @CurrentUser() actor: RequestUser) {
    assertTenantScope(actor, tenantId);
    return this.payments.create(tenantId, dto, actor);
  }

  @Get()
  @RequirePermissions(Permission.AP_READ)
  @ApiOkResponse({ type: VendorPaymentResponseDto, isArray: true })
  @ApiQuery({ name: 'organizationId', required: false })
  @ApiQuery({ name: 'vendorId', required: false })
  list(
    @Param('tenantId') tenantId: string,
    @CurrentUser() actor: RequestUser,
    @Query('organizationId') organizationId?: string,
    @Query('vendorId') vendorId?: string,
  ) {
    assertTenantScope(actor, tenantId);
    return this.payments.list(tenantId, organizationId, vendorId, actor);
  }

  @Get(':id')
  @RequirePermissions(Permission.AP_READ)
  @ApiOkResponse({ type: VendorPaymentResponseDto })
  findById(@Param('tenantId') tenantId: string, @Param('id') id: string, @CurrentUser() actor: RequestUser) {
    assertTenantScope(actor, tenantId);
    return this.payments.findById(tenantId, id, actor);
  }
}
