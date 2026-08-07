import { Injectable } from '@nestjs/common';
import { OrganizationUnit } from '@prisma/client';
import { PrismaService } from '@africahr/platform-database';

export interface CreateOrganizationUnitInput {
  organizationId: string;
  parentId?: string | null;
  name: string;
  code: string;
  createdBy?: string;
}

@Injectable()
export class OrganizationUnitRepository {
  constructor(private readonly prisma: PrismaService) {}

  create(tenantId: string, input: CreateOrganizationUnitInput): Promise<OrganizationUnit> {
    return this.prisma.withTenantContext(tenantId, (tx) =>
      tx.organizationUnit.create({
        data: {
          tenantId,
          organizationId: input.organizationId,
          parentId: input.parentId ?? null,
          name: input.name,
          code: input.code,
          createdBy: input.createdBy,
          updatedBy: input.createdBy,
        },
      }),
    );
  }

  findById(tenantId: string, id: string): Promise<OrganizationUnit | null> {
    return this.prisma.withTenantContext(tenantId, (tx) =>
      tx.organizationUnit.findFirst({ where: { id, tenantId, deletedAt: null } }),
    );
  }

  listByOrganization(tenantId: string, organizationId: string): Promise<OrganizationUnit[]> {
    return this.prisma.withTenantContext(tenantId, (tx) =>
      tx.organizationUnit.findMany({
        where: { tenantId, organizationId, deletedAt: null },
        orderBy: { createdAt: 'asc' },
      }),
    );
  }

  updateParent(
    tenantId: string,
    id: string,
    parentId: string | null,
    updatedBy?: string,
  ): Promise<OrganizationUnit> {
    return this.prisma.withTenantContext(tenantId, (tx) =>
      tx.organizationUnit.update({
        where: { id },
        data: { parentId, updatedBy },
      }),
    );
  }

  update(
    tenantId: string,
    id: string,
    data: { name?: string; code?: string },
    updatedBy?: string,
  ): Promise<OrganizationUnit> {
    return this.prisma.withTenantContext(tenantId, (tx) =>
      tx.organizationUnit.update({
        where: { id },
        data: { ...data, updatedBy },
      }),
    );
  }

  countChildren(tenantId: string, id: string): Promise<number> {
    return this.prisma.withTenantContext(tenantId, (tx) =>
      tx.organizationUnit.count({ where: { tenantId, parentId: id, deletedAt: null } }),
    );
  }

  countEmployees(tenantId: string, id: string): Promise<number> {
    return this.prisma.withTenantContext(tenantId, (tx) =>
      tx.employee.count({ where: { tenantId, organizationUnitId: id, deletedAt: null } }),
    );
  }

  softDelete(tenantId: string, id: string, updatedBy?: string): Promise<OrganizationUnit> {
    return this.prisma.withTenantContext(tenantId, (tx) =>
      tx.organizationUnit.update({
        where: { id },
        data: { deletedAt: new Date(), updatedBy },
      }),
    );
  }
}
