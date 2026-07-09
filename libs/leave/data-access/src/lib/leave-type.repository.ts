import { Injectable } from '@nestjs/common';
import { LeaveType, Prisma } from '@prisma/client';
import { PrismaService } from '@africahr/platform-database';

export interface CreateLeaveTypeInput {
  name: string;
  code: string;
  isPaid?: boolean;
  defaultEntitlementDays: Prisma.Decimal | number;
  createdBy?: string;
}

export interface UpdateLeaveTypeInput {
  name?: string;
  isPaid?: boolean;
  defaultEntitlementDays?: Prisma.Decimal | number;
  isActive?: boolean;
  updatedBy?: string;
}

export interface ListLeaveTypesParams {
  activeOnly?: boolean;
}

@Injectable()
export class LeaveTypeRepository {
  constructor(private readonly prisma: PrismaService) {}

  create(tenantId: string, input: CreateLeaveTypeInput): Promise<LeaveType> {
    return this.prisma.withTenantContext(tenantId, (tx) =>
      tx.leaveType.create({
        data: {
          tenantId,
          name: input.name,
          code: input.code,
          isPaid: input.isPaid ?? true,
          defaultEntitlementDays: input.defaultEntitlementDays,
          createdBy: input.createdBy,
          updatedBy: input.createdBy,
        },
      }),
    );
  }

  findById(tenantId: string, id: string): Promise<LeaveType | null> {
    return this.prisma.withTenantContext(tenantId, (tx) =>
      tx.leaveType.findFirst({ where: { id, tenantId, deletedAt: null } }),
    );
  }

  list(tenantId: string, params: ListLeaveTypesParams = {}): Promise<LeaveType[]> {
    return this.prisma.withTenantContext(tenantId, (tx) =>
      tx.leaveType.findMany({
        where: { tenantId, deletedAt: null, isActive: params.activeOnly ? true : undefined },
        orderBy: { name: 'asc' },
      }),
    );
  }

  update(tenantId: string, id: string, input: UpdateLeaveTypeInput): Promise<LeaveType> {
    return this.prisma.withTenantContext(tenantId, (tx) =>
      tx.leaveType.update({
        where: { id },
        data: {
          name: input.name,
          isPaid: input.isPaid,
          defaultEntitlementDays: input.defaultEntitlementDays,
          isActive: input.isActive,
          updatedBy: input.updatedBy,
        },
      }),
    );
  }
}
