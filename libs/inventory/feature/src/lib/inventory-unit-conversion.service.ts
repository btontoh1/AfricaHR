import { ConflictException, Injectable } from '@nestjs/common';
import { InventoryUnitConversion } from '@prisma/client';
import { InventoryUnitConversionRepository } from '@africahr/inventory-data-access';
import { wouldCreateCycle } from '@africahr/inventory-domain';
import { CreateInventoryUnitConversionDto } from './dto/create-inventory-unit-conversion.dto';

@Injectable()
export class InventoryUnitConversionService {
  constructor(private readonly conversions: InventoryUnitConversionRepository) {}

  /** Rejects an edge that would create a cycle in the tenant's unit conversion graph (see inventory-domain's wouldCreateCycle) - a cyclic graph has no well-defined factor between the units it touches. */
  async create(
    tenantId: string,
    dto: CreateInventoryUnitConversionDto,
    actorId?: string,
  ): Promise<InventoryUnitConversion> {
    const existing = await this.conversions.list(tenantId);
    const edges = existing.map((edge) => ({
      fromUnitId: edge.fromUnitId,
      toUnitId: edge.toUnitId,
      factor: Number(edge.factor),
    }));

    if (wouldCreateCycle(edges, { fromUnitId: dto.fromUnitId, toUnitId: dto.toUnitId })) {
      throw new ConflictException('This conversion would create a cycle with an existing conversion');
    }

    return this.conversions.create(tenantId, { ...dto, createdBy: actorId });
  }

  list(tenantId: string): Promise<InventoryUnitConversion[]> {
    return this.conversions.list(tenantId);
  }

  remove(tenantId: string, id: string): Promise<InventoryUnitConversion> {
    return this.conversions.delete(tenantId, id);
  }
}
