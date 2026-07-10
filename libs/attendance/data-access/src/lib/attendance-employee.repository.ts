import { Injectable } from '@nestjs/common';
import { PrismaService } from '@africahr/platform-database';

export interface AttendanceEligibleEmployee {
  id: string;
  userId: string | null;
}

/**
 * Reads only the Employee fields attendance needs. scope:attendance cannot
 * import employee-data-access's repository/service classes (Nx module
 * boundary), so this queries the shared "employees" table directly through
 * PrismaService — same pattern as payroll's PayrollEmployeeRepository and
 * leave's LeaveEmployeeRepository. findByUserId is what makes self-service
 * clock-in/out possible.
 */
@Injectable()
export class AttendanceEmployeeRepository {
  constructor(private readonly prisma: PrismaService) {}

  findByUserId(tenantId: string, userId: string): Promise<AttendanceEligibleEmployee | null> {
    return this.prisma.withTenantContext(tenantId, (tx) =>
      tx.employee.findFirst({
        where: { tenantId, userId, deletedAt: null },
        select: { id: true, userId: true },
      }),
    );
  }

  findById(tenantId: string, id: string): Promise<AttendanceEligibleEmployee | null> {
    return this.prisma.withTenantContext(tenantId, (tx) =>
      tx.employee.findFirst({
        where: { id, tenantId, deletedAt: null },
        select: { id: true, userId: true },
      }),
    );
  }
}
