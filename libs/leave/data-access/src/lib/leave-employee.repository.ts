import { Injectable } from '@nestjs/common';
import { PrismaService } from '@africahr/platform-database';

export interface LeaveEligibleEmployee {
  id: string;
  userId: string | null;
}

/**
 * Reads only the Employee fields leave management needs. scope:leave cannot
 * import employee-data-access's repository/service classes (Nx module
 * boundary), so this queries the shared "employees" table directly through
 * PrismaService — same pattern as payroll's PayrollEmployeeRepository.
 * findByUserId is what makes self-service possible: resolving "the caller's
 * own Employee record" from the JWT's User id.
 */
@Injectable()
export class LeaveEmployeeRepository {
  constructor(private readonly prisma: PrismaService) {}

  findByUserId(tenantId: string, userId: string): Promise<LeaveEligibleEmployee | null> {
    return this.prisma.withTenantContext(tenantId, (tx) =>
      tx.employee.findFirst({
        where: { tenantId, userId, deletedAt: null },
        select: { id: true, userId: true },
      }),
    );
  }

  findById(tenantId: string, id: string): Promise<LeaveEligibleEmployee | null> {
    return this.prisma.withTenantContext(tenantId, (tx) =>
      tx.employee.findFirst({
        where: { id, tenantId, deletedAt: null },
        select: { id: true, userId: true },
      }),
    );
  }
}
