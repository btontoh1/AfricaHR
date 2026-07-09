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
import { EmployeeService } from './employee.service';
import { CreateEmployeeDto } from './dto/create-employee.dto';
import { UpdateEmployeeDto } from './dto/update-employee.dto';
import { UpdateEmploymentStatusDto } from './dto/update-employment-status.dto';

@ApiTags('employees')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('tenants/:tenantId/employees')
export class EmployeeController {
  constructor(private readonly employees: EmployeeService) {}

  @Post()
  @RequirePermissions(Permission.EMPLOYEE_MANAGE)
  create(
    @Param('tenantId') tenantId: string,
    @Body() dto: CreateEmployeeDto,
    @CurrentUser() actor: RequestUser,
  ) {
    assertTenantScope(actor, tenantId);
    return this.employees.create(tenantId, dto, actor.sub);
  }

  @Get()
  @RequirePermissions(Permission.EMPLOYEE_READ)
  list(
    @Param('tenantId') tenantId: string,
    @CurrentUser() actor: RequestUser,
    @Query('organizationId') organizationId?: string,
    @Query('organizationUnitId') organizationUnitId?: string,
  ) {
    assertTenantScope(actor, tenantId);
    return this.employees.list(tenantId, { organizationId, organizationUnitId });
  }

  @Get(':id')
  @RequirePermissions(Permission.EMPLOYEE_READ)
  findById(
    @Param('tenantId') tenantId: string,
    @Param('id') id: string,
    @CurrentUser() actor: RequestUser,
  ) {
    assertTenantScope(actor, tenantId);
    return this.employees.findById(tenantId, id);
  }

  @Patch(':id')
  @RequirePermissions(Permission.EMPLOYEE_MANAGE)
  update(
    @Param('tenantId') tenantId: string,
    @Param('id') id: string,
    @Body() dto: UpdateEmployeeDto,
    @CurrentUser() actor: RequestUser,
  ) {
    assertTenantScope(actor, tenantId);
    return this.employees.update(tenantId, id, dto, actor.sub);
  }

  @Patch(':id/status')
  @RequirePermissions(Permission.EMPLOYEE_MANAGE)
  updateStatus(
    @Param('tenantId') tenantId: string,
    @Param('id') id: string,
    @Body() dto: UpdateEmploymentStatusDto,
    @CurrentUser() actor: RequestUser,
  ) {
    assertTenantScope(actor, tenantId);
    return this.employees.updateStatus(tenantId, id, dto.status, dto.terminationDate, actor.sub);
  }

  @Get(':id/history')
  @RequirePermissions(Permission.EMPLOYEE_READ)
  getHistory(
    @Param('tenantId') tenantId: string,
    @Param('id') id: string,
    @CurrentUser() actor: RequestUser,
  ) {
    assertTenantScope(actor, tenantId);
    return this.employees.getHistory(tenantId, id);
  }
}
