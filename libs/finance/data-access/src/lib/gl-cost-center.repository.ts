import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '@africahr/platform-database';

export interface CreateCostCenterInput {
  organizationId: string;
  name: string;
  code?: string;
  createdBy?: string;
}

@Injectable()
export class GlCostCenterRepository {
  constructor(private readonly prisma: PrismaService) {}

  create(tenantId: string, input: CreateCostCenterInput) {
    return this.prisma.withTenantContext(tenantId, (tx) =>
      tx.glCostCenter.create({
        data: {
          tenantId,
          organizationId: input.organizationId,
          name: input.name,
          code: input.code,
          createdBy: input.createdBy,
          updatedBy: input.createdBy,
        },
      }),
    );
  }

  findById(tenantId: string, id: string) {
    return this.prisma.withTenantContext(tenantId, (tx) =>
      tx.glCostCenter.findFirst({ where: { id, tenantId } }),
    );
  }

  list(tenantId: string, organizationId?: string) {
    return this.prisma.withTenantContext(tenantId, (tx) =>
      tx.glCostCenter.findMany({
        where: { tenantId, organizationId },
        orderBy: { name: 'asc' },
      }),
    );
  }
}

export type GlCostCenterRow = Prisma.GlCostCenterGetPayload<Record<string, never>>;
