import { Injectable } from '@nestjs/common';
import { PerformanceReviewCycle, PerformanceReviewCycleStatus } from '@prisma/client';
import { PrismaService } from '@africahr/platform-database';

export interface CreatePerformanceReviewCycleInput {
  name: string;
  startDate: Date;
  endDate: Date;
  createdBy?: string;
}

export interface UpdatePerformanceReviewCycleInput {
  name?: string;
  startDate?: Date;
  endDate?: Date;
  status?: PerformanceReviewCycleStatus;
  updatedBy?: string;
}

export interface ListPerformanceReviewCyclesParams {
  status?: PerformanceReviewCycleStatus;
}

@Injectable()
export class PerformanceReviewCycleRepository {
  constructor(private readonly prisma: PrismaService) {}

  create(
    tenantId: string,
    input: CreatePerformanceReviewCycleInput,
  ): Promise<PerformanceReviewCycle> {
    return this.prisma.withTenantContext(tenantId, (tx) =>
      tx.performanceReviewCycle.create({
        data: {
          tenantId,
          name: input.name,
          startDate: input.startDate,
          endDate: input.endDate,
          createdBy: input.createdBy,
          updatedBy: input.createdBy,
        },
      }),
    );
  }

  findById(tenantId: string, id: string): Promise<PerformanceReviewCycle | null> {
    return this.prisma.withTenantContext(tenantId, (tx) =>
      tx.performanceReviewCycle.findFirst({ where: { id, tenantId, deletedAt: null } }),
    );
  }

  list(
    tenantId: string,
    params: ListPerformanceReviewCyclesParams = {},
  ): Promise<PerformanceReviewCycle[]> {
    return this.prisma.withTenantContext(tenantId, (tx) =>
      tx.performanceReviewCycle.findMany({
        where: { tenantId, deletedAt: null, status: params.status },
        orderBy: { startDate: 'desc' },
      }),
    );
  }

  update(
    tenantId: string,
    id: string,
    input: UpdatePerformanceReviewCycleInput,
  ): Promise<PerformanceReviewCycle> {
    return this.prisma.withTenantContext(tenantId, (tx) =>
      tx.performanceReviewCycle.update({
        where: { id },
        data: {
          name: input.name,
          startDate: input.startDate,
          endDate: input.endDate,
          status: input.status,
          updatedBy: input.updatedBy,
        },
      }),
    );
  }
}
