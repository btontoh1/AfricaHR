import { Injectable } from '@nestjs/common';
import { PayRun, PayRunStatus } from '@prisma/client';
import { PrismaService } from '@africahr/platform-database';

export interface CreatePayRunInput {
  organizationId: string;
  periodStart: Date;
  periodEnd: Date;
  payDate: Date;
  createdBy?: string;
}

export interface ListPayRunsParams {
  organizationId?: string;
}

export interface UpdatePayRunStatusInput {
  status: PayRunStatus;
  approvedAt?: Date;
  approvedBy?: string;
  paidAt?: Date;
  updatedBy?: string;
}

@Injectable()
export class PayRunRepository {
  constructor(private readonly prisma: PrismaService) {}

  create(tenantId: string, input: CreatePayRunInput): Promise<PayRun> {
    return this.prisma.withTenantContext(tenantId, (tx) =>
      tx.payRun.create({
        data: {
          tenantId,
          organizationId: input.organizationId,
          periodStart: input.periodStart,
          periodEnd: input.periodEnd,
          payDate: input.payDate,
          createdBy: input.createdBy,
          updatedBy: input.createdBy,
        },
      }),
    );
  }

  findById(tenantId: string, id: string): Promise<PayRun | null> {
    return this.prisma.withTenantContext(tenantId, (tx) =>
      tx.payRun.findFirst({ where: { id, tenantId, deletedAt: null } }),
    );
  }

  list(tenantId: string, params: ListPayRunsParams = {}): Promise<PayRun[]> {
    return this.prisma.withTenantContext(tenantId, (tx) =>
      tx.payRun.findMany({
        where: { tenantId, deletedAt: null, organizationId: params.organizationId },
        orderBy: { periodStart: 'desc' },
      }),
    );
  }

  updateStatus(tenantId: string, id: string, input: UpdatePayRunStatusInput): Promise<PayRun> {
    return this.prisma.withTenantContext(tenantId, (tx) =>
      tx.payRun.update({
        where: { id },
        data: {
          status: input.status,
          approvedAt: input.approvedAt,
          approvedBy: input.approvedBy,
          paidAt: input.paidAt,
          updatedBy: input.updatedBy,
        },
      }),
    );
  }
}
