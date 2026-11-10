import { Injectable } from '@nestjs/common';
import { InventoryUnit } from '@prisma/client';
import { PrismaService } from '@africahr/platform-database';

export interface CreateInventoryUnitInput {
  name: string;
  abbreviation: string;
  createdBy?: string;
}

export interface UpdateInventoryUnitInput {
  name?: string;
  abbreviation?: string;
  isActive?: boolean;
  updatedBy?: string;
}

@Injectable()
export class InventoryUnitRepository {
  constructor(private readonly prisma: PrismaService) {}

  create(tenantId: string, input: CreateInventoryUnitInput): Promise<InventoryUnit> {
    return this.prisma.withTenantContext(tenantId, (tx) =>
      tx.inventoryUnit.create({
        data: {
          tenantId,
          name: input.name,
          abbreviation: input.abbreviation,
          createdBy: input.createdBy,
          updatedBy: input.createdBy,
        },
      }),
    );
  }

  findById(tenantId: string, id: string): Promise<InventoryUnit | null> {
    return this.prisma.withTenantContext(tenantId, (tx) =>
      tx.inventoryUnit.findFirst({ where: { id, tenantId, deletedAt: null } }),
    );
  }

  list(tenantId: string): Promise<InventoryUnit[]> {
    return this.prisma.withTenantContext(tenantId, (tx) =>
      tx.inventoryUnit.findMany({ where: { tenantId, deletedAt: null }, orderBy: { name: 'asc' } }),
    );
  }

  update(tenantId: string, id: string, input: UpdateInventoryUnitInput): Promise<InventoryUnit> {
    return this.prisma.withTenantContext(tenantId, (tx) =>
      tx.inventoryUnit.update({
        where: { id },
        data: {
          name: input.name,
          abbreviation: input.abbreviation,
          isActive: input.isActive,
          updatedBy: input.updatedBy,
        },
      }),
    );
  }

  softDelete(tenantId: string, id: string, updatedBy?: string): Promise<InventoryUnit> {
    return this.prisma.withTenantContext(tenantId, (tx) =>
      tx.inventoryUnit.update({ where: { id }, data: { deletedAt: new Date(), updatedBy } }),
    );
  }
}
