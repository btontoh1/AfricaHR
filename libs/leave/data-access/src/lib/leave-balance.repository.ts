import { Injectable } from '@nestjs/common';
import { LeaveBalance, Prisma } from '@prisma/client';
import { PrismaService } from '@africahr/platform-database';

export interface UpsertLeaveBalanceEntitlementInput {
  employeeId: string;
  leaveTypeId: string;
  year: number;
  entitledDays: Prisma.Decimal | number;
  actorId?: string;
}

export type LeaveBalanceWithType = Prisma.LeaveBalanceGetPayload<{ include: { leaveType: true } }>;

@Injectable()
export class LeaveBalanceRepository {
  constructor(private readonly prisma: PrismaService) {}

  /** Creates or re-sets the entitled-days grant for an employee/leaveType/year. */
  upsertEntitlement(
    tenantId: string,
    input: UpsertLeaveBalanceEntitlementInput,
  ): Promise<LeaveBalance> {
    return this.prisma.withTenantContext(tenantId, (tx) =>
      tx.leaveBalance.upsert({
        where: {
          tenantId_employeeId_leaveTypeId_year: {
            tenantId,
            employeeId: input.employeeId,
            leaveTypeId: input.leaveTypeId,
            year: input.year,
          },
        },
        create: {
          tenantId,
          employeeId: input.employeeId,
          leaveTypeId: input.leaveTypeId,
          year: input.year,
          entitledDays: input.entitledDays,
          createdBy: input.actorId,
          updatedBy: input.actorId,
        },
        update: {
          entitledDays: input.entitledDays,
          updatedBy: input.actorId,
        },
      }),
    );
  }

  findByEmployeeAndType(
    tenantId: string,
    employeeId: string,
    leaveTypeId: string,
    year: number,
  ): Promise<LeaveBalance | null> {
    return this.prisma.withTenantContext(tenantId, (tx) =>
      tx.leaveBalance.findFirst({ where: { tenantId, employeeId, leaveTypeId, year } }),
    );
  }

  listByEmployee(tenantId: string, employeeId: string, year: number): Promise<LeaveBalanceWithType[]> {
    return this.prisma.withTenantContext(tenantId, (tx) =>
      tx.leaveBalance.findMany({
        where: { tenantId, employeeId, year },
        include: { leaveType: true },
        orderBy: { leaveType: { name: 'asc' } },
      }),
    );
  }

  incrementUsedDays(
    tenantId: string,
    id: string,
    days: Prisma.Decimal | number,
    updatedBy?: string,
  ): Promise<LeaveBalance> {
    return this.prisma.withTenantContext(tenantId, (tx) =>
      tx.leaveBalance.update({
        where: { id },
        data: { usedDays: { increment: days }, updatedBy },
      }),
    );
  }

  decrementUsedDays(
    tenantId: string,
    id: string,
    days: Prisma.Decimal | number,
    updatedBy?: string,
  ): Promise<LeaveBalance> {
    return this.prisma.withTenantContext(tenantId, (tx) =>
      tx.leaveBalance.update({
        where: { id },
        data: { usedDays: { decrement: days }, updatedBy },
      }),
    );
  }
}
