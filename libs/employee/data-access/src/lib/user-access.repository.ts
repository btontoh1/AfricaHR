import { Injectable } from '@nestjs/common';
import { PrismaService } from '@africahr/platform-database';
import { TokenRevocationService } from '@africahr/platform-auth';

/**
 * Deactivates the User account linked to a terminated employee.
 * scope:employee cannot depend on scope:iam's repository/service classes
 * (Nx module boundary), so this reaches into the shared "users" table
 * directly through PrismaService - the same "trust the shared schema"
 * pattern as PayrollEmployeeRepository/AttendanceEmployeeRepository etc.,
 * just a write instead of a scoped read. TokenRevocationService lives in
 * platform-auth (scope:platform, not scope:iam) for the same boundary
 * reason, so it's reachable here without violating the constraint.
 */
@Injectable()
export class UserAccessRepository {
  constructor(
    private readonly prisma: PrismaService,
    private readonly revocation: TokenRevocationService,
  ) {}

  async deactivate(tenantId: string, userId: string, actorId?: string): Promise<void> {
    await this.prisma.withTenantContext(tenantId, (tx) =>
      tx.user.update({ where: { id: userId }, data: { isActive: false, updatedBy: actorId } }),
    );
    await this.revocation.revokeAllForUser(userId);
  }
}
