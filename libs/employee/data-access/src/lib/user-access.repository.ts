import { Injectable } from '@nestjs/common';
import { PrismaService } from '@africahr/platform-database';

/**
 * Deactivates the User account linked to a terminated employee.
 * scope:employee cannot depend on scope:iam's repository/service classes
 * (Nx module boundary), so this reaches into the shared "users" table
 * directly through PrismaService - the same "trust the shared schema"
 * pattern as PayrollEmployeeRepository/AttendanceEmployeeRepository etc.,
 * just a write instead of a scoped read.
 */
@Injectable()
export class UserAccessRepository {
  constructor(private readonly prisma: PrismaService) {}

  async deactivate(tenantId: string, userId: string, actorId?: string): Promise<void> {
    await this.prisma.withTenantContext(tenantId, (tx) =>
      tx.user.update({ where: { id: userId }, data: { isActive: false, updatedBy: actorId } }),
    );
  }
}
