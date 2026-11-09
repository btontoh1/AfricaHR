import { Injectable } from '@nestjs/common';
import { InventoryUnit } from '@prisma/client';
import { InventoryUnitRepository } from '@africahr/inventory-data-access';
import { CreateInventoryUnitDto } from './dto/create-inventory-unit.dto';
import { UpdateInventoryUnitDto } from './dto/update-inventory-unit.dto';

@Injectable()
export class InventoryUnitService {
  constructor(private readonly units: InventoryUnitRepository) {}

  create(tenantId: string, dto: CreateInventoryUnitDto, actorId?: string): Promise<InventoryUnit> {
    return this.units.create(tenantId, { ...dto, createdBy: actorId });
  }

  list(tenantId: string): Promise<InventoryUnit[]> {
    return this.units.list(tenantId);
  }

  update(tenantId: string, id: string, dto: UpdateInventoryUnitDto, actorId?: string): Promise<InventoryUnit> {
    return this.units.update(tenantId, id, { ...dto, updatedBy: actorId });
  }

  remove(tenantId: string, id: string, actorId?: string): Promise<InventoryUnit> {
    return this.units.softDelete(tenantId, id, actorId);
  }
}
