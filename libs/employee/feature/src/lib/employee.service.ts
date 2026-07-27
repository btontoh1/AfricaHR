import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { Employee, Prisma } from '@prisma/client';
import { wouldCreateCycle } from '@africahr/platform-core';
import { AuditService } from '@africahr/platform-audit';
import {
  EmployeeRepository,
  EmploymentHistoryRepository,
  UserAccessRepository,
} from '@africahr/employee-data-access';
import {
  canTransitionEmploymentStatus,
  EmploymentStatus,
  formatEmployeeNumber,
  isValidEmployeeNumber,
} from '@africahr/employee-domain';
import { CreateEmployeeDto } from './dto/create-employee.dto';
import { UpdateEmployeeDto } from './dto/update-employee.dto';

/**
 * Employee references organizationId/organizationUnitId (owned by the
 * Tenancy bounded context) and userId (owned by IAM) — but scope:employee
 * can only depend on scope:employee + scope:platform, not on scope:tenancy
 * or scope:iam as a peer. Rather than reach across bounded contexts, this
 * relies on the database's own foreign-key/unique constraints and
 * translates the failure here. This keeps Employee Management honestly
 * decoupled from Tenancy/IAM's internals — the only coupling is the shared
 * schema, which is what has to be re-solved anyway if this module is ever
 * extracted into its own service.
 */
function translateReferenceError(error: unknown, dto: { organizationUnitId?: string | null; managerId?: string | null; userId?: string | null }): never {
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    if (error.code === 'P2003') {
      const field = (error.meta?.['constraint'] as string | undefined) ?? '';
      if (field.includes('organization_unit')) {
        throw new NotFoundException(`Organization unit "${dto.organizationUnitId}" not found`);
      }
      if (field.includes('manager')) {
        throw new NotFoundException(`Manager "${dto.managerId}" not found`);
      }
      if (field.includes('user')) {
        throw new NotFoundException(`User "${dto.userId}" not found`);
      }
      throw new NotFoundException('Referenced organization not found');
    }
    if (error.code === 'P2002') {
      throw new ConflictException(
        `User "${dto.userId}" is already linked to another employee, or the employee number is already in use`,
      );
    }
  }
  throw error;
}

@Injectable()
export class EmployeeService {
  constructor(
    private readonly employees: EmployeeRepository,
    private readonly history: EmploymentHistoryRepository,
    private readonly userAccess: UserAccessRepository,
    private readonly audit: AuditService,
  ) {}

  async create(tenantId: string, dto: CreateEmployeeDto, actorId?: string): Promise<Employee> {
    const employeeNumber = dto.employeeNumber ?? (await this.generateEmployeeNumber(tenantId));
    if (!isValidEmployeeNumber(employeeNumber)) {
      throw new BadRequestException(`"${employeeNumber}" is not a valid employee number`);
    }

    let employee: Employee;
    try {
      employee = await this.employees.create(tenantId, {
        organizationId: dto.organizationId,
        organizationUnitId: dto.organizationUnitId,
        userId: dto.userId,
        managerId: dto.managerId,
        employeeNumber,
        firstName: dto.firstName,
        lastName: dto.lastName,
        dateOfBirth: dto.dateOfBirth ? new Date(dto.dateOfBirth) : undefined,
        gender: dto.gender,
        nationality: dto.nationality,
        phone: dto.phone,
        personalEmail: dto.personalEmail,
        jobTitle: dto.jobTitle,
        employmentType: dto.employmentType,
        hireDate: new Date(dto.hireDate),
        baseSalary: dto.baseSalary,
        payFrequency: dto.payFrequency,
        currency: dto.currency,
        annualRentPaid: dto.annualRentPaid,
        countryCode: dto.countryCode,
        metadata: dto.metadata as Prisma.InputJsonValue | undefined,
        createdBy: actorId,
      });
    } catch (error) {
      translateReferenceError(error, dto);
    }

    await this.audit.record({
      tenantId,
      actorUserId: actorId ?? null,
      action: 'employee.created',
      resourceType: 'Employee',
      resourceId: employee.id,
    });

    return employee;
  }

  async findById(tenantId: string, id: string): Promise<Employee> {
    const employee = await this.employees.findById(tenantId, id);
    if (!employee) {
      throw new NotFoundException(`Employee "${id}" not found`);
    }
    return employee;
  }

  list(
    tenantId: string,
    params: { organizationId?: string; organizationUnitId?: string } = {},
  ): Promise<Employee[]> {
    return this.employees.list(tenantId, params);
  }

  async getHistory(tenantId: string, id: string) {
    await this.findById(tenantId, id);
    return this.history.listByEmployee(tenantId, id);
  }

  async update(
    tenantId: string,
    id: string,
    dto: UpdateEmployeeDto,
    actorId?: string,
  ): Promise<Employee> {
    const existing = await this.findById(tenantId, id);

    if (dto.managerId !== undefined && dto.managerId !== null) {
      if (dto.managerId === id) {
        throw new BadRequestException('An employee cannot be their own manager');
      }
      const all = await this.employees.list(tenantId);
      const graph = all.map((e) => ({ id: e.id, parentId: e.managerId }));
      if (wouldCreateCycle(graph, id, dto.managerId)) {
        throw new BadRequestException('Cannot assign a manager who reports (directly or indirectly) to this employee');
      }
    }

    let updated: Employee;
    try {
      updated = await this.employees.update(tenantId, id, {
        organizationUnitId: dto.organizationUnitId,
        managerId: dto.managerId,
        userId: dto.userId,
        jobTitle: dto.jobTitle,
        baseSalary: dto.baseSalary,
        payFrequency: dto.payFrequency,
        annualRentPaid: dto.annualRentPaid,
        updatedBy: actorId,
      });
    } catch (error) {
      translateReferenceError(error, dto);
    }

    await this.recordFieldChange(tenantId, id, 'jobTitle', existing.jobTitle, dto.jobTitle, actorId);
    await this.recordFieldChange(
      tenantId,
      id,
      'organizationUnitId',
      existing.organizationUnitId,
      dto.organizationUnitId,
      actorId,
    );
    await this.recordFieldChange(tenantId, id, 'managerId', existing.managerId, dto.managerId, actorId);

    await this.audit.record({
      tenantId,
      actorUserId: actorId ?? null,
      action: 'employee.updated',
      resourceType: 'Employee',
      resourceId: id,
    });

    return updated;
  }

  async updateStatus(
    tenantId: string,
    id: string,
    status: EmploymentStatus,
    terminationDate?: string,
    actorId?: string,
  ): Promise<Employee> {
    const existing = await this.findById(tenantId, id);

    if (!canTransitionEmploymentStatus(existing.employmentStatus, status)) {
      throw new ConflictException(
        `Cannot transition employee from ${existing.employmentStatus} to ${status}`,
      );
    }

    const resolvedTerminationDate =
      status === EmploymentStatus.TERMINATED
        ? terminationDate
          ? new Date(terminationDate)
          : new Date()
        : undefined;

    const updated = await this.employees.updateStatus(
      tenantId,
      id,
      status,
      actorId,
      resolvedTerminationDate,
    );

    await this.history.create(tenantId, {
      employeeId: id,
      changeType: 'STATUS_CHANGE',
      fieldName: 'employmentStatus',
      oldValue: existing.employmentStatus,
      newValue: status,
      effectiveDate: resolvedTerminationDate ?? new Date(),
      createdBy: actorId,
    });

    await this.audit.record({
      tenantId,
      actorUserId: actorId ?? null,
      action: 'employee.status_changed',
      resourceType: 'Employee',
      resourceId: id,
      metadata: { from: existing.employmentStatus, to: status },
    });

    // Termination is a dead end in the status state machine (no transition
    // back out of it), so this only ever needs to deactivate, never
    // reactivate, portal access. UserAccessRepository.deactivate also
    // revokes any already-issued access token for this user, so access is
    // cut immediately rather than waiting out the token's remaining TTL.
    if (status === EmploymentStatus.TERMINATED && existing.userId) {
      await this.userAccess.deactivate(tenantId, existing.userId, actorId);

      await this.audit.record({
        tenantId,
        actorUserId: actorId ?? null,
        action: 'employee.portal_access_deactivated',
        resourceType: 'User',
        resourceId: existing.userId,
      });
    }

    return updated;
  }

  async softDelete(tenantId: string, id: string, actorId?: string): Promise<Employee> {
    await this.findById(tenantId, id);
    const deleted = await this.employees.softDelete(tenantId, id, actorId);

    await this.audit.record({
      tenantId,
      actorUserId: actorId ?? null,
      action: 'employee.deleted',
      resourceType: 'Employee',
      resourceId: id,
    });

    return deleted;
  }

  private async generateEmployeeNumber(tenantId: string): Promise<string> {
    const count = await this.employees.count(tenantId);
    return formatEmployeeNumber(count + 1);
  }

  private async recordFieldChange(
    tenantId: string,
    employeeId: string,
    fieldName: string,
    oldValue: string | null | undefined,
    newValue: string | null | undefined,
    actorId?: string,
  ): Promise<void> {
    if (newValue === undefined || newValue === oldValue) {
      return;
    }

    await this.history.create(tenantId, {
      employeeId,
      changeType: `${fieldName.toUpperCase()}_CHANGE`,
      fieldName,
      oldValue: oldValue ?? null,
      newValue,
      effectiveDate: new Date(),
      createdBy: actorId,
    });
  }
}
