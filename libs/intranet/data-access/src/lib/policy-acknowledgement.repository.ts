import { Injectable } from '@nestjs/common';
import { PolicyAcknowledgement } from '@prisma/client';
import { PrismaService } from '@africahr/platform-database';

export interface PolicyAcknowledgementWithEmployee extends PolicyAcknowledgement {
  employee: { id: string; firstName: string; lastName: string };
}

@Injectable()
export class PolicyAcknowledgementRepository {
  constructor(private readonly prisma: PrismaService) {}

  findOne(tenantId: string, policyId: string, employeeId: string): Promise<PolicyAcknowledgement | null> {
    return this.prisma.withTenantContext(tenantId, (tx) =>
      tx.policyAcknowledgement.findFirst({ where: { tenantId, policyId, employeeId } }),
    );
  }

  /**
   * Idempotent: ticking "I have read this" twice is a no-op, not an
   * error - the unique (policyId, employeeId) index is what create() would
   * otherwise violate, so callers check findOne() first (see
   * PolicyService.acknowledge) rather than relying on a caught constraint
   * error here.
   */
  create(tenantId: string, policyId: string, employeeId: string): Promise<PolicyAcknowledgement> {
    return this.prisma.withTenantContext(tenantId, (tx) =>
      tx.policyAcknowledgement.create({ data: { tenantId, policyId, employeeId } }),
    );
  }

  async listPolicyIdsAcknowledgedByEmployee(tenantId: string, employeeId: string): Promise<string[]> {
    const rows = await this.prisma.withTenantContext(tenantId, (tx) =>
      tx.policyAcknowledgement.findMany({ where: { tenantId, employeeId }, select: { policyId: true } }),
    );
    return rows.map((row) => row.policyId);
  }

  listForPolicy(tenantId: string, policyId: string): Promise<PolicyAcknowledgementWithEmployee[]> {
    return this.prisma.withTenantContext(tenantId, (tx) =>
      tx.policyAcknowledgement.findMany({
        where: { tenantId, policyId },
        orderBy: { readAt: 'desc' },
        include: { employee: { select: { id: true, firstName: true, lastName: true } } },
      }),
    );
  }
}
