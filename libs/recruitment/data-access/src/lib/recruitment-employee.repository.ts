import { Injectable } from '@nestjs/common';
import { PrismaService } from '@africahr/platform-database';

export interface RecruitmentEligibleEmployee {
  id: string;
  userId: string | null;
}

/**
 * Reads only the Employee fields recruitment needs. scope:recruitment
 * cannot import employee-data-access's repository/service classes (Nx
 * module boundary), so this queries the shared "employees" table directly
 * through PrismaService — same pattern as every other module's equivalent
 * reader. findByUserId is what makes the hiring-manager authorization tier
 * possible: resolving "the caller's own Employee id" to compare against
 * JobRequisition.hiringManagerId (see project memory — the second
 * application of the manager-authorization pattern from Module 8).
 */
@Injectable()
export class RecruitmentEmployeeRepository {
  constructor(private readonly prisma: PrismaService) {}

  findByUserId(tenantId: string, userId: string): Promise<RecruitmentEligibleEmployee | null> {
    return this.prisma.withTenantContext(tenantId, (tx) =>
      tx.employee.findFirst({
        where: { tenantId, userId, deletedAt: null },
        select: { id: true, userId: true },
      }),
    );
  }
}
