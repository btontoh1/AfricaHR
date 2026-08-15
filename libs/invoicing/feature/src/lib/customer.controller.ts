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
import { CustomerService } from './customer.service';
import { CreateCustomerDto } from './dto/create-customer.dto';
import { UpdateCustomerDto } from './dto/update-customer.dto';
import { CustomerResponseDto } from './dto/customer-response.dto';

// AddOnGuard runs after PermissionsGuard - order matters (NestJS runs
// @UseGuards left to right), so a caller without the base role permission
// gets that error rather than a leaked add-on/paywall message.
@ApiTags('customers')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard, AddOnGuard)
@RequireAddOn(AddOnModule.INVOICING)
@Controller('tenants/:tenantId/customers')
export class CustomerController {
  constructor(private readonly customers: CustomerService) {}

  @Post()
  @RequirePermissions(Permission.INVOICING_MANAGE)
  @ApiOkResponse({ type: CustomerResponseDto })
  create(
    @Param('tenantId') tenantId: string,
    @Body() dto: CreateCustomerDto,
    @CurrentUser() actor: RequestUser,
  ) {
    assertTenantScope(actor, tenantId);
    return this.customers.create(tenantId, dto, actor);
  }

  @Get()
  @RequirePermissions(Permission.INVOICING_READ)
  @ApiOkResponse({ type: CustomerResponseDto, isArray: true })
  @ApiQuery({ name: 'organizationId', required: false })
  list(
    @Param('tenantId') tenantId: string,
    @CurrentUser() actor: RequestUser,
    @Query('organizationId') organizationId?: string,
  ) {
    assertTenantScope(actor, tenantId);
    return this.customers.list(tenantId, organizationId, actor);
  }

  @Get(':id')
  @RequirePermissions(Permission.INVOICING_READ)
  @ApiOkResponse({ type: CustomerResponseDto })
  findById(
    @Param('tenantId') tenantId: string,
    @Param('id') id: string,
    @CurrentUser() actor: RequestUser,
  ) {
    assertTenantScope(actor, tenantId);
    return this.customers.findById(tenantId, id, actor);
  }

  @Patch(':id')
  @RequirePermissions(Permission.INVOICING_MANAGE)
  @ApiOkResponse({ type: CustomerResponseDto })
  update(
    @Param('tenantId') tenantId: string,
    @Param('id') id: string,
    @Body() dto: UpdateCustomerDto,
    @CurrentUser() actor: RequestUser,
  ) {
    assertTenantScope(actor, tenantId);
    return this.customers.update(tenantId, id, dto, actor);
  }

  @Delete(':id')
  @RequirePermissions(Permission.INVOICING_MANAGE)
  @ApiOkResponse({ type: CustomerResponseDto })
  softDelete(
    @Param('tenantId') tenantId: string,
    @Param('id') id: string,
    @CurrentUser() actor: RequestUser,
  ) {
    assertTenantScope(actor, tenantId);
    return this.customers.softDelete(tenantId, id, actor);
  }
}
