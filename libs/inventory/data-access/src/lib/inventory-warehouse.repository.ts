import { Injectable } from '@nestjs/common';
import { InventoryWarehouse } from '@prisma/client';
import { PrismaService } from '@africahr/platform-database';

export interface CreateInventoryWarehouseInput {
  organizationId: string;
  name: string;
  code: string;
  managerEmployeeId?: string;
  address?: string;
  phone?: string;
  createdBy?: string;
}

export interface UpdateInventoryWarehouseInput {
  name?: string;
  managerEmployeeId?: string | null;
  address?: string | null;
  phone?: string | null;
  isActive?: boolean;
  updatedBy?: string;
}

@Injectable()
export class InventoryWarehouseRepository {
  constructor(private readonly prisma: PrismaService) {}

  create(tenantId: string, input: CreateInventoryWarehouseInput): Promise<InventoryWarehouse> {
    return this.prisma.withTenantContext(tenantId, (tx) =>
      tx.inventoryWarehouse.create({
        data: {
          tenantId,
          organizationId: input.organizationId,
          name: input.name,
          code: input.code,
          managerEmployeeId: input.managerEmployeeId,
          address: input.address,
          phone: input.phone,
          createdBy: input.createdBy,
          updatedBy: input.createdBy,
        },
      }),
    );
  }

  findById(tenantId: string, id: string): Promise<InventoryWarehouse | null> {
    return this.prisma.withTenantContext(tenantId, (tx) =>
      tx.inventoryWarehouse.findFirst({ where: { id, tenantId, deletedAt: null } }),
    );
  }

  list(tenantId: string, organizationId?: string): Promise<InventoryWarehouse[]> {
    return this.prisma.withTenantContext(tenantId, (tx) =>
      tx.inventoryWarehouse.findMany({
        where: { tenantId, organizationId, deletedAt: null },
        orderBy: { name: 'asc' },
      }),
    );
  }

  update(tenantId: string, id: string, input: UpdateInventoryWarehouseInput): Promise<InventoryWarehouse> {
    return this.prisma.withTenantContext(tenantId, (tx) =>
      tx.inventoryWarehouse.update({
        where: { id },
        data: {
          name: input.name,
          managerEmployeeId: input.managerEmployeeId,
          address: input.address,
          phone: input.phone,
          isActive: input.isActive,
          updatedBy: input.updatedBy,
        },
      }),
    );
  }

  softDelete(tenantId: string, id: string, updatedBy?: string): Promise<InventoryWarehouse> {
    return this.prisma.withTenantContext(tenantId, (tx) =>
      tx.inventoryWarehouse.update({ where: { id }, data: { deletedAt: new Date(), updatedBy } }),
    );
  }
}
