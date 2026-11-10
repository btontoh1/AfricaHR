import { Injectable } from '@nestjs/common';
import { PrismaService } from '@africahr/platform-database';

export interface InventoryEligibleEmployee {
  id: string;
  userId: string | null;
  managerId: string | null;
  firstName: string;
  lastName: string;
}

/**
 * Reads only the Employee fields procurement/self-service/assets need.
 * scope:inventory cannot import employee-data-access's repository/service
 * classes (Nx module boundary), so this queries the shared "employees"
 * table directly through PrismaService - same pattern as
 * PerformanceEmployeeRepository, payroll/leave/attendance/benefits' own
 * equivalent readers.
 */
@Injectable()
export class InventoryEmployeeRepository {
  constructor(private readonly prisma: PrismaService) {}

  findByUserId(tenantId: string, userId: string): Promise<InventoryEligibleEmployee | null> {
    return this.prisma.withTenantContext(tenantId, (tx) =>
      tx.employee.findFirst({
        where: { tenantId, userId, deletedAt: null },
        select: { id: true, userId: true, managerId: true, firstName: true, lastName: true },
      }),
    );
  }

  findById(tenantId: string, id: string): Promise<InventoryEligibleEmployee | null> {
    return this.prisma.withTenantContext(tenantId, (tx) =>
      tx.employee.findFirst({
        where: { id, tenantId, deletedAt: null },
        select: { id: true, userId: true, managerId: true, firstName: true, lastName: true },
      }),
    );
  }

  findManyByIds(tenantId: string, ids: string[]): Promise<InventoryEligibleEmployee[]> {
    return this.prisma.withTenantContext(tenantId, (tx) =>
      tx.employee.findMany({
        where: { tenantId, id: { in: ids }, deletedAt: null },
        select: { id: true, userId: true, managerId: true, firstName: true, lastName: true },
      }),
    );
  }
}
