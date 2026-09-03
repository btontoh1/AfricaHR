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
  /** The status this pay run must currently be in for the write to apply - see updateStatus's docstring. */
  fromStatus: PayRunStatus;
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

  /** Batched lookup for enriching a list of payslips with their pay run's period - avoids one query per payslip. */
  findManyByIds(tenantId: string, ids: string[]): Promise<PayRun[]> {
    return this.prisma.withTenantContext(tenantId, (tx) =>
      tx.payRun.findMany({ where: { tenantId, id: { in: ids }, deletedAt: null } }),
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

  /**
   * Conditional on the pay run still being in fromStatus - two concurrent
   * requests for the same transition (a double-click, a client retry after
   * a timeout) must not both succeed. Returns null if the row wasn't in
   * fromStatus when this ran (another request already moved it, or it was
   * never there), so the caller can tell a genuine race from a normal write
   * and respond accordingly instead of silently repeating side effects
   * (audit records, Paystack disbursement) a second time.
   */
  async updateStatus(tenantId: string, id: string, input: UpdatePayRunStatusInput): Promise<PayRun | null> {
    return this.prisma.withTenantContext(tenantId, async (tx) => {
      const { count } = await tx.payRun.updateMany({
        where: { id, tenantId, status: input.fromStatus },
        data: {
          status: input.status,
          approvedAt: input.approvedAt,
          approvedBy: input.approvedBy,
          paidAt: input.paidAt,
          updatedBy: input.updatedBy,
        },
      });
      if (count === 0) {
        return null;
      }
      return tx.payRun.findFirstOrThrow({ where: { id, tenantId } });
    });
  }
}
