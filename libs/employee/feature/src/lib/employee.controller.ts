import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
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
import { EmployeeService } from './employee.service';
import { CreateEmployeeDto } from './dto/create-employee.dto';
import { UpdateEmployeeDto } from './dto/update-employee.dto';
import { UpdateEmploymentStatusDto } from './dto/update-employment-status.dto';
import { EmployeeResponseDto } from './dto/employee-response.dto';

@ApiTags('employees')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('tenants/:tenantId/employees')
export class EmployeeController {
  constructor(private readonly employees: EmployeeService) {}

  @Post()
  @RequirePermissions(Permission.EMPLOYEE_MANAGE)
  @ApiOkResponse({ type: EmployeeResponseDto })
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
  @ApiOkResponse({ type: EmployeeResponseDto, isArray: true })
  @ApiQuery({ name: 'organizationId', required: false })
  @ApiQuery({ name: 'organizationUnitId', required: false })
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
  @ApiOkResponse({ type: EmployeeResponseDto })
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
  @ApiOkResponse({ type: EmployeeResponseDto })
  update(
    @Param('tenantId') tenantId: string,
    @Param('id') id: string,
    @Body() dto: UpdateEmployeeDto,
    @CurrentUser() actor: RequestUser,
  ) {
    assertTenantScope(actor, tenantId);
    return this.employees.update(tenantId, id, dto, actor.sub);
  }

  @Delete(':id')
  @RequirePermissions(Permission.EMPLOYEE_MANAGE)
  @ApiOkResponse({ type: EmployeeResponseDto })
  softDelete(
    @Param('tenantId') tenantId: string,
    @Param('id') id: string,
    @CurrentUser() actor: RequestUser,
  ) {
    assertTenantScope(actor, tenantId);
    return this.employees.softDelete(tenantId, id, actor.sub);
  }

  @Patch(':id/status')
  @RequirePermissions(Permission.EMPLOYEE_MANAGE)
  @ApiOkResponse({ type: EmployeeResponseDto })
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
