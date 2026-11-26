import { Injectable } from '@nestjs/common';
import { PrismaService } from '@africahr/platform-database';

export interface IntranetEligibleEmployee {
  id: string;
  userId: string | null;
  organizationId: string;
  organizationUnitId: string | null;
  firstName: string;
  lastName: string;
}

/**
 * Reads only the Employee fields the intranet feature needs. scope:intranet
 * cannot import employee-data-access's repository/service classes (Nx
 * module boundary), so this queries the shared "employees" table directly
 * through PrismaService - same pattern as every other scope's own reader
 * (payroll/leave/attendance/benefits/inventory/...). findByUserId is what
 * makes self-service possible: resolving "the caller's own Employee
 * record" from the JWT's User id, including which Organization/
 * OrganizationUnit they're in, since that's what audience targeting
 * filters on.
 */
@Injectable()
export class IntranetEmployeeRepository {
  constructor(private readonly prisma: PrismaService) {}

  findByUserId(tenantId: string, userId: string): Promise<IntranetEligibleEmployee | null> {
    return this.prisma.withTenantContext(tenantId, (tx) =>
      tx.employee.findFirst({
        where: { tenantId, userId, deletedAt: null },
        select: {
          id: true,
          userId: true,
          organizationId: true,
          organizationUnitId: true,
          firstName: true,
          lastName: true,
        },
      }),
    );
  }

  findById(tenantId: string, id: string): Promise<IntranetEligibleEmployee | null> {
    return this.prisma.withTenantContext(tenantId, (tx) =>
      tx.employee.findFirst({
        where: { id, tenantId, deletedAt: null },
        select: {
          id: true,
          userId: true,
          organizationId: true,
          organizationUnitId: true,
          firstName: true,
          lastName: true,
        },
      }),
    );
  }
}
