import { Injectable } from '@nestjs/common';
import { InventoryUnitConversion } from '@prisma/client';
import { PrismaService } from '@africahr/platform-database';

export interface CreateInventoryUnitConversionInput {
  fromUnitId: string;
  toUnitId: string;
  factor: number;
  createdBy?: string;
}

@Injectable()
export class InventoryUnitConversionRepository {
  constructor(private readonly prisma: PrismaService) {}

  create(tenantId: string, input: CreateInventoryUnitConversionInput): Promise<InventoryUnitConversion> {
    return this.prisma.withTenantContext(tenantId, (tx) =>
      tx.inventoryUnitConversion.create({
        data: {
          tenantId,
          fromUnitId: input.fromUnitId,
          toUnitId: input.toUnitId,
          factor: input.factor,
          createdBy: input.createdBy,
          updatedBy: input.createdBy,
        },
      }),
    );
  }

  /** Every conversion edge for the tenant - the full graph, used to build the in-memory graph that InventoryUnitConversionService checks wouldCreateCycle/convertQuantity against before writing a new edge. */
  list(tenantId: string): Promise<InventoryUnitConversion[]> {
    return this.prisma.withTenantContext(tenantId, (tx) => tx.inventoryUnitConversion.findMany({ where: { tenantId } }));
  }

  delete(tenantId: string, id: string): Promise<InventoryUnitConversion> {
    return this.prisma.withTenantContext(tenantId, (tx) => tx.inventoryUnitConversion.delete({ where: { id } }));
  }
}
