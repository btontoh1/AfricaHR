import { Injectable } from '@nestjs/common';
import { InventoryWarehouse } from '@prisma/client';
import { InventoryWarehouseRepository } from '@africahr/inventory-data-access';
import { CreateInventoryWarehouseDto } from './dto/create-inventory-warehouse.dto';
import { UpdateInventoryWarehouseDto } from './dto/update-inventory-warehouse.dto';

@Injectable()
export class InventoryWarehouseService {
  constructor(private readonly warehouses: InventoryWarehouseRepository) {}

  create(tenantId: string, dto: CreateInventoryWarehouseDto, actorId?: string): Promise<InventoryWarehouse> {
    return this.warehouses.create(tenantId, { ...dto, createdBy: actorId });
  }

  list(tenantId: string, organizationId?: string): Promise<InventoryWarehouse[]> {
    return this.warehouses.list(tenantId, organizationId);
  }

  update(
    tenantId: string,
    id: string,
    dto: UpdateInventoryWarehouseDto,
    actorId?: string,
  ): Promise<InventoryWarehouse> {
    return this.warehouses.update(tenantId, id, { ...dto, updatedBy: actorId });
  }

  remove(tenantId: string, id: string, actorId?: string): Promise<InventoryWarehouse> {
    return this.warehouses.softDelete(tenantId, id, actorId);
  }
}
