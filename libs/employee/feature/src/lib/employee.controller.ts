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
import { EmployeeBulkImportService } from './employee-bulk-import.service';
import { CreateEmployeeDto } from './dto/create-employee.dto';
import { UpdateEmployeeDto } from './dto/update-employee.dto';
import { UpdateEmploymentStatusDto } from './dto/update-employment-status.dto';
import { EmployeeResponseDto } from './dto/employee-response.dto';
import { BulkImportEmployeesDto } from './dto/bulk-import-employees.dto';
import { BulkImportResultDto } from './dto/bulk-import-result.dto';

@ApiTags('employees')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('tenants/:tenantId/employees')
export class EmployeeController {
  constructor(
    private readonly employees: EmployeeService,
    private readonly bulkImport: EmployeeBulkImportService,
  ) {}

  @Post()
  @RequirePermissions(Permission.EMPLOYEE_MANAGE)
  @ApiOkResponse({ type: EmployeeResponseDto })
  create(
    @Param('tenantId') tenantId: string,
    @Body() dto: CreateEmployeeDto,
    @CurrentUser() actor: RequestUser,
  ) {
    assertTenantScope(actor, tenantId);
    return this.employees.create(tenantId, dto, actor);
  }

  /** Row-level partial success: invalid/failing rows are reported back rather than aborting the whole batch - see EmployeeBulkImportService. */
  @Post('bulk-import')
  @RequirePermissions(Permission.EMPLOYEE_MANAGE)
  @ApiOkResponse({ type: BulkImportResultDto })
  bulkImportEmployees(
    @Param('tenantId') tenantId: string,
    @Body() dto: BulkImportEmployeesDto,
    @CurrentUser() actor: RequestUser,
  ) {
    assertTenantScope(actor, tenantId);
    return this.bulkImport.import(tenantId, dto.organizationId, dto.csv, actor);
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
    return this.employees.list(tenantId, { organizationId, organizationUnitId }, actor);
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
    return this.employees.findById(tenantId, id, actor);
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
    return this.employees.update(tenantId, id, dto, actor);
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
    return this.employees.softDelete(tenantId, id, actor);
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
    return this.employees.updateStatus(tenantId, id, dto.status, dto.terminationDate, actor);
  }

  @Get(':id/history')
  @RequirePermissions(Permission.EMPLOYEE_READ)
  getHistory(
    @Param('tenantId') tenantId: string,
    @Param('id') id: string,
    @CurrentUser() actor: RequestUser,
  ) {
    assertTenantScope(actor, tenantId);
    return this.employees.getHistory(tenantId, id, actor);
  }
}
