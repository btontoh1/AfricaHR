import { Injectable } from '@nestjs/common';
import { Employee, EmploymentStatus, EmploymentType, Prisma } from '@prisma/client';
import { PrismaService } from '@africahr/platform-database';

export interface CreateEmployeeInput {
  organizationId: string;
  organizationUnitId?: string;
  userId?: string;
  managerId?: string;
  employeeNumber: string;
  firstName: string;
  lastName: string;
  dateOfBirth?: Date;
  gender?: string;
  nationality?: string;
  phone?: string;
  personalEmail?: string;
  jobTitle: string;
  employmentType: EmploymentType;
  hireDate: Date;
  baseSalary?: Prisma.Decimal | number;
  payFrequency?: string;
  currency?: string;
  countryCode: string;
  metadata?: Prisma.InputJsonValue;
  createdBy?: string;
}

export interface ListEmployeesParams {
  organizationId?: string;
  organizationUnitId?: string;
  skip?: number;
  take?: number;
}

export interface UpdateEmployeeInput {
  organizationUnitId?: string | null;
  managerId?: string | null;
  userId?: string | null;
  jobTitle?: string;
  baseSalary?: Prisma.Decimal | number | null;
  payFrequency?: string | null;
  updatedBy?: string;
}

@Injectable()
export class EmployeeRepository {
  constructor(private readonly prisma: PrismaService) {}

  create(tenantId: string, input: CreateEmployeeInput): Promise<Employee> {
    return this.prisma.withTenantContext(tenantId, (tx) =>
      tx.employee.create({
        data: {
          tenantId,
          organizationId: input.organizationId,
          organizationUnitId: input.organizationUnitId,
          userId: input.userId,
          managerId: input.managerId,
          employeeNumber: input.employeeNumber,
          firstName: input.firstName,
          lastName: input.lastName,
          dateOfBirth: input.dateOfBirth,
          gender: input.gender,
          nationality: input.nationality,
          phone: input.phone,
          personalEmail: input.personalEmail,
          jobTitle: input.jobTitle,
          employmentType: input.employmentType,
          hireDate: input.hireDate,
          baseSalary: input.baseSalary,
          payFrequency: input.payFrequency,
          currency: input.currency,
          countryCode: input.countryCode,
          metadata: input.metadata,
          createdBy: input.createdBy,
          updatedBy: input.createdBy,
        },
      }),
    );
  }

  findById(tenantId: string, id: string): Promise<Employee | null> {
    return this.prisma.withTenantContext(tenantId, (tx) =>
      tx.employee.findFirst({ where: { id, tenantId, deletedAt: null } }),
    );
  }

  /** Resolves the caller's own employee record for self-service endpoints. */
  findByUserId(tenantId: string, userId: string): Promise<Employee | null> {
    return this.prisma.withTenantContext(tenantId, (tx) =>
      tx.employee.findFirst({ where: { tenantId, userId, deletedAt: null } }),
    );
  }

  list(tenantId: string, params: ListEmployeesParams = {}): Promise<Employee[]> {
    return this.prisma.withTenantContext(tenantId, (tx) =>
      tx.employee.findMany({
        where: {
          tenantId,
          deletedAt: null,
          organizationId: params.organizationId,
          organizationUnitId: params.organizationUnitId,
        },
        orderBy: { createdAt: 'asc' },
        skip: params.skip,
        take: params.take,
      }),
    );
  }

  /**
   * Used to compute the next employee-number sequence. Not
   * concurrency-safe under simultaneous creates (no advisory lock) — an
   * acceptable v1 gap given HR-admin-driven creation is low-concurrency;
   * the `[tenantId, employeeNumber]` unique constraint still prevents a
   * silent collision, it just surfaces as a create error to retry.
   */
  count(tenantId: string): Promise<number> {
    return this.prisma.withTenantContext(tenantId, (tx) => tx.employee.count({ where: { tenantId } }));
  }

  update(tenantId: string, id: string, input: UpdateEmployeeInput): Promise<Employee> {
    return this.prisma.withTenantContext(tenantId, (tx) =>
      tx.employee.update({
        where: { id },
        data: {
          organizationUnitId: input.organizationUnitId,
          managerId: input.managerId,
          userId: input.userId,
          jobTitle: input.jobTitle,
          baseSalary: input.baseSalary,
          payFrequency: input.payFrequency,
          updatedBy: input.updatedBy,
        },
      }),
    );
  }

  updateStatus(
    tenantId: string,
    id: string,
    status: EmploymentStatus,
    updatedBy?: string,
    terminationDate?: Date,
  ): Promise<Employee> {
    return this.prisma.withTenantContext(tenantId, (tx) =>
      tx.employee.update({
        where: { id },
        data: { employmentStatus: status, terminationDate, updatedBy },
      }),
    );
  }

  softDelete(tenantId: string, id: string, updatedBy?: string): Promise<Employee> {
    return this.prisma.withTenantContext(tenantId, (tx) =>
      tx.employee.update({
        where: { id },
        data: { deletedAt: new Date(), updatedBy },
      }),
    );
  }
}
