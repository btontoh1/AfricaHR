import { Injectable } from '@nestjs/common';
import { InventoryCategory } from '@prisma/client';
import { InventoryCategoryRepository } from '@africahr/inventory-data-access';
import { CreateInventoryCategoryDto } from './dto/create-inventory-category.dto';
import { UpdateInventoryCategoryDto } from './dto/update-inventory-category.dto';

@Injectable()
export class InventoryCategoryService {
  constructor(private readonly categories: InventoryCategoryRepository) {}

  create(tenantId: string, dto: CreateInventoryCategoryDto, actorId?: string): Promise<InventoryCategory> {
    return this.categories.create(tenantId, { ...dto, createdBy: actorId });
  }

  list(tenantId: string): Promise<InventoryCategory[]> {
    return this.categories.list(tenantId);
  }

  update(tenantId: string, id: string, dto: UpdateInventoryCategoryDto, actorId?: string): Promise<InventoryCategory> {
    return this.categories.update(tenantId, id, { ...dto, updatedBy: actorId });
  }

  remove(tenantId: string, id: string, actorId?: string): Promise<InventoryCategory> {
    return this.categories.softDelete(tenantId, id, actorId);
  }
}
