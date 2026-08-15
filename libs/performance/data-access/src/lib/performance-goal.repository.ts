import { Injectable } from '@nestjs/common';
import { GoalPerspective, PerformanceGoal, PerformanceGoalStatus } from '@prisma/client';
import { PrismaService } from '@africahr/platform-database';

export interface CreatePerformanceGoalInput {
  employeeId: string;
  title: string;
  description?: string;
  targetDate?: Date;
  perspective?: GoalPerspective;
  createdBy?: string;
}

export interface UpdatePerformanceGoalInput {
  title?: string;
  description?: string;
  targetDate?: Date | null;
  status?: PerformanceGoalStatus;
  progressPercent?: number;
  perspective?: GoalPerspective;
  updatedBy?: string;
}

export interface ListPerformanceGoalsParams {
  employeeId?: string;
  status?: PerformanceGoalStatus;
}

@Injectable()
export class PerformanceGoalRepository {
  constructor(private readonly prisma: PrismaService) {}

  create(tenantId: string, input: CreatePerformanceGoalInput): Promise<PerformanceGoal> {
    return this.prisma.withTenantContext(tenantId, (tx) =>
      tx.performanceGoal.create({
        data: {
          tenantId,
          employeeId: input.employeeId,
          title: input.title,
          description: input.description,
          targetDate: input.targetDate,
          perspective: input.perspective,
          createdBy: input.createdBy,
          updatedBy: input.createdBy,
        },
      }),
    );
  }

  findById(tenantId: string, id: string): Promise<PerformanceGoal | null> {
    return this.prisma.withTenantContext(tenantId, (tx) =>
      tx.performanceGoal.findFirst({ where: { id, tenantId, deletedAt: null } }),
    );
  }

  list(tenantId: string, params: ListPerformanceGoalsParams = {}): Promise<PerformanceGoal[]> {
    return this.prisma.withTenantContext(tenantId, (tx) =>
      tx.performanceGoal.findMany({
        where: {
          tenantId,
          deletedAt: null,
          employeeId: params.employeeId,
          status: params.status,
        },
        orderBy: { createdAt: 'desc' },
      }),
    );
  }

  update(
    tenantId: string,
    id: string,
    input: UpdatePerformanceGoalInput,
  ): Promise<PerformanceGoal> {
    return this.prisma.withTenantContext(tenantId, (tx) =>
      tx.performanceGoal.update({
        where: { id },
        data: {
          title: input.title,
          description: input.description,
          targetDate: input.targetDate,
          status: input.status,
          progressPercent: input.progressPercent,
          perspective: input.perspective,
          updatedBy: input.updatedBy,
        },
      }),
    );
  }

  softDelete(tenantId: string, id: string, updatedBy?: string): Promise<PerformanceGoal> {
    return this.prisma.withTenantContext(tenantId, (tx) =>
      tx.performanceGoal.update({
        where: { id },
        data: { deletedAt: new Date(), updatedBy },
      }),
    );
  }
}
