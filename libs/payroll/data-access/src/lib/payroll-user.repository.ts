import { Injectable } from '@nestjs/common';
import { SystemRole } from '@prisma/client';
import { PrismaService } from '@africahr/platform-database';

/**
 * Reads only the User fields payroll's segregation-of-duties check needs.
 * scope:payroll cannot import iam-data-access's repository/service classes
 * (Nx module boundary), so this queries the shared "users" table directly
 * through PrismaService - same cross-bounded-context read pattern used by
 * notifications-feature's NotificationUserRepository.
 */
@Injectable()
export class PayrollUserRepository {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Whether some *other* active user in this tenant holds any of the
   * given roles - used to decide whether the person who processed a pay
   * run can be allowed to also approve/pay it themselves (only when no
   * one else qualifies, so a solo-admin tenant is never locked out) or
   * must be blocked in favor of real separation of duties.
   */
  async hasOtherActiveUserWithRole(
    tenantId: string,
    roles: SystemRole[],
    excludeUserId: string,
  ): Promise<boolean> {
    const match = await this.prisma.withTenantContext(tenantId, (tx) =>
      tx.user.findFirst({
        where: { tenantId, role: { in: roles }, isActive: true, deletedAt: null, id: { not: excludeUserId } },
        select: { id: true },
      }),
    );
    return match !== null;
  }
}
