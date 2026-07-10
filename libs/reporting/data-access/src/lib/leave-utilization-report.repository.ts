import { Injectable } from '@nestjs/common';
import { PrismaService } from '@africahr/platform-database';

export interface LeaveUtilizationReportParams {
  year: number;
  organizationId?: string;
  leaveTypeId?: string;
}

export interface LeaveUtilizationByType {
  leaveTypeId: string;
  leaveTypeName: string;
  totalEntitledDays: number;
  totalUsedDays: number;
}

/**
 * Reads LeaveBalance/LeaveType fields leave-utilization reporting needs,
 * via the shared PrismaService directly (same cross-bounded-context read
 * pattern as HeadcountReportRepository). LeaveBalance has no
 * organizationId of its own, so the org filter goes through the
 * employee relation.
 */
@Injectable()
export class LeaveUtilizationReportRepository {
  constructor(private readonly prisma: PrismaService) {}

  async summarizeByLeaveType(
    tenantId: string,
    params: LeaveUtilizationReportParams,
  ): Promise<LeaveUtilizationByType[]> {
    const balances = await this.prisma.withTenantContext(tenantId, (tx) =>
      tx.leaveBalance.findMany({
        where: {
          tenantId,
          year: params.year,
          leaveTypeId: params.leaveTypeId,
          employee: params.organizationId ? { organizationId: params.organizationId } : undefined,
        },
        select: {
          entitledDays: true,
          usedDays: true,
          leaveType: { select: { id: true, name: true } },
        },
      }),
    );

    const byType = new Map<string, LeaveUtilizationByType>();
    for (const balance of balances) {
      const existing = byType.get(balance.leaveType.id) ?? {
        leaveTypeId: balance.leaveType.id,
        leaveTypeName: balance.leaveType.name,
        totalEntitledDays: 0,
        totalUsedDays: 0,
      };
      existing.totalEntitledDays += balance.entitledDays.toNumber();
      existing.totalUsedDays += balance.usedDays.toNumber();
      byType.set(balance.leaveType.id, existing);
    }

    return Array.from(byType.values());
  }
}
