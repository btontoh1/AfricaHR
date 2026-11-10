import { ConflictException, Injectable } from '@nestjs/common';
import { InventoryProduct } from '@prisma/client';
import { InventoryProductRepository } from '@africahr/inventory-data-access';
import { CreateInventoryProductDto } from './dto/create-inventory-product.dto';
import { UpdateInventoryProductDto } from './dto/update-inventory-product.dto';

@Injectable()
export class InventoryProductService {
  constructor(private readonly products: InventoryProductRepository) {}

  /** SKUs are unique per tenant, not globally - checked here rather than relying solely on the DB's unique constraint so a duplicate attempt gets a clear 409 instead of a raw Prisma error. */
  async create(tenantId: string, dto: CreateInventoryProductDto, actorId?: string): Promise<InventoryProduct> {
    const existing = await this.products.findBySku(tenantId, dto.sku);
    if (existing) {
      throw new ConflictException(`A product with SKU "${dto.sku}" already exists`);
    }
    return this.products.create(tenantId, { ...dto, createdBy: actorId });
  }

  list(tenantId: string, categoryId?: string): Promise<InventoryProduct[]> {
    return this.products.list(tenantId, categoryId);
  }

  update(tenantId: string, id: string, dto: UpdateInventoryProductDto, actorId?: string): Promise<InventoryProduct> {
    return this.products.update(tenantId, id, { ...dto, updatedBy: actorId });
  }

  remove(tenantId: string, id: string, actorId?: string): Promise<InventoryProduct> {
    return this.products.softDelete(tenantId, id, actorId);
  }
}
