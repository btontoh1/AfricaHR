import { Injectable } from '@nestjs/common';
import { PerformanceReview, PerformanceReviewStatus } from '@prisma/client';
import { PrismaService } from '@africahr/platform-database';

export interface CreatePerformanceReviewInput {
  employeeId: string;
  cycleId: string;
  createdBy?: string;
}

export interface UpdatePerformanceReviewInput {
  status?: PerformanceReviewStatus;
  selfRating?: number;
  selfComments?: string;
  selfSubmittedAt?: Date;
  managerRating?: number;
  managerComments?: string;
  managerUserId?: string;
  managerReviewedAt?: Date;
  updatedBy?: string;
}

export interface ListPerformanceReviewsParams {
  employeeId?: string;
  cycleId?: string;
  status?: PerformanceReviewStatus;
}

@Injectable()
export class PerformanceReviewRepository {
  constructor(private readonly prisma: PrismaService) {}

  create(tenantId: string, input: CreatePerformanceReviewInput): Promise<PerformanceReview> {
    return this.prisma.withTenantContext(tenantId, (tx) =>
      tx.performanceReview.create({
        data: {
          tenantId,
          employeeId: input.employeeId,
          cycleId: input.cycleId,
          createdBy: input.createdBy,
          updatedBy: input.createdBy,
        },
      }),
    );
  }

  findById(tenantId: string, id: string): Promise<PerformanceReview | null> {
    return this.prisma.withTenantContext(tenantId, (tx) =>
      tx.performanceReview.findFirst({ where: { id, tenantId, deletedAt: null } }),
    );
  }

  findByEmployeeAndCycle(
    tenantId: string,
    employeeId: string,
    cycleId: string,
  ): Promise<PerformanceReview | null> {
    return this.prisma.withTenantContext(tenantId, (tx) =>
      tx.performanceReview.findFirst({
        where: { tenantId, employeeId, cycleId, deletedAt: null },
      }),
    );
  }

  list(
    tenantId: string,
    params: ListPerformanceReviewsParams = {},
  ): Promise<PerformanceReview[]> {
    return this.prisma.withTenantContext(tenantId, (tx) =>
      tx.performanceReview.findMany({
        where: {
          tenantId,
          deletedAt: null,
          employeeId: params.employeeId,
          cycleId: params.cycleId,
          status: params.status,
        },
        orderBy: { createdAt: 'desc' },
      }),
    );
  }

  update(
    tenantId: string,
    id: string,
    input: UpdatePerformanceReviewInput,
  ): Promise<PerformanceReview> {
    return this.prisma.withTenantContext(tenantId, (tx) =>
      tx.performanceReview.update({
        where: { id },
        data: {
          status: input.status,
          selfRating: input.selfRating,
          selfComments: input.selfComments,
          selfSubmittedAt: input.selfSubmittedAt,
          managerRating: input.managerRating,
          managerComments: input.managerComments,
          managerUserId: input.managerUserId,
          managerReviewedAt: input.managerReviewedAt,
          updatedBy: input.updatedBy,
        },
      }),
    );
  }
}
