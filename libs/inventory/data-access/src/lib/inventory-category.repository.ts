import { Injectable } from '@nestjs/common';
import { InventoryCategory } from '@prisma/client';
import { PrismaService } from '@africahr/platform-database';

export interface CreateInventoryCategoryInput {
  name: string;
  parentId?: string | null;
  createdBy?: string;
}

export interface UpdateInventoryCategoryInput {
  name?: string;
  parentId?: string | null;
  isActive?: boolean;
  updatedBy?: string;
}

@Injectable()
export class InventoryCategoryRepository {
  constructor(private readonly prisma: PrismaService) {}

  create(tenantId: string, input: CreateInventoryCategoryInput): Promise<InventoryCategory> {
    return this.prisma.withTenantContext(tenantId, (tx) =>
      tx.inventoryCategory.create({
        data: {
          tenantId,
          name: input.name,
          parentId: input.parentId,
          createdBy: input.createdBy,
          updatedBy: input.createdBy,
        },
      }),
    );
  }

  findById(tenantId: string, id: string): Promise<InventoryCategory | null> {
    return this.prisma.withTenantContext(tenantId, (tx) =>
      tx.inventoryCategory.findFirst({ where: { id, tenantId, deletedAt: null } }),
    );
  }

  list(tenantId: string): Promise<InventoryCategory[]> {
    return this.prisma.withTenantContext(tenantId, (tx) =>
      tx.inventoryCategory.findMany({ where: { tenantId, deletedAt: null }, orderBy: { name: 'asc' } }),
    );
  }

  update(tenantId: string, id: string, input: UpdateInventoryCategoryInput): Promise<InventoryCategory> {
    return this.prisma.withTenantContext(tenantId, (tx) =>
      tx.inventoryCategory.update({
        where: { id },
        data: {
          name: input.name,
          parentId: input.parentId,
          isActive: input.isActive,
          updatedBy: input.updatedBy,
        },
      }),
    );
  }

  softDelete(tenantId: string, id: string, updatedBy?: string): Promise<InventoryCategory> {
    return this.prisma.withTenantContext(tenantId, (tx) =>
      tx.inventoryCategory.update({ where: { id }, data: { deletedAt: new Date(), updatedBy } }),
    );
  }
}
