import { Injectable } from '@nestjs/common';
import { InventoryProduct } from '@prisma/client';
import { PrismaService } from '@africahr/platform-database';

export interface CreateInventoryProductInput {
  sku: string;
  name: string;
  baseUnitId: string;
  purchasePrice: number;
  categoryId?: string | null;
  barcode?: string;
  description?: string;
  brand?: string;
  manufacturer?: string;
  sellingPrice?: number;
  minStockLevel?: number;
  maxStockLevel?: number;
  imageStorageKey?: string;
  tracksBatch?: boolean;
  createdBy?: string;
}

export interface UpdateInventoryProductInput {
  name?: string;
  categoryId?: string | null;
  barcode?: string | null;
  description?: string | null;
  brand?: string | null;
  manufacturer?: string | null;
  purchasePrice?: number;
  sellingPrice?: number | null;
  minStockLevel?: number | null;
  maxStockLevel?: number | null;
  imageStorageKey?: string | null;
  tracksBatch?: boolean;
  isActive?: boolean;
  updatedBy?: string;
}

@Injectable()
export class InventoryProductRepository {
  constructor(private readonly prisma: PrismaService) {}

  create(tenantId: string, input: CreateInventoryProductInput): Promise<InventoryProduct> {
    return this.prisma.withTenantContext(tenantId, (tx) =>
      tx.inventoryProduct.create({
        data: {
          tenantId,
          sku: input.sku,
          name: input.name,
          baseUnitId: input.baseUnitId,
          purchasePrice: input.purchasePrice,
          categoryId: input.categoryId,
          barcode: input.barcode,
          description: input.description,
          brand: input.brand,
          manufacturer: input.manufacturer,
          sellingPrice: input.sellingPrice,
          minStockLevel: input.minStockLevel,
          maxStockLevel: input.maxStockLevel,
          imageStorageKey: input.imageStorageKey,
          tracksBatch: input.tracksBatch ?? false,
          createdBy: input.createdBy,
          updatedBy: input.createdBy,
        },
      }),
    );
  }

  findById(tenantId: string, id: string): Promise<InventoryProduct | null> {
    return this.prisma.withTenantContext(tenantId, (tx) =>
      tx.inventoryProduct.findFirst({ where: { id, tenantId, deletedAt: null } }),
    );
  }

  /** Used before create()/update() to reject a duplicate SKU within the tenant - SKUs are only unique per tenant (@@unique([tenantId, sku])), so the same SKU is fine across different tenants. */
  findBySku(tenantId: string, sku: string): Promise<InventoryProduct | null> {
    return this.prisma.withTenantContext(tenantId, (tx) =>
      tx.inventoryProduct.findFirst({ where: { tenantId, sku, deletedAt: null } }),
    );
  }

  list(tenantId: string, categoryId?: string): Promise<InventoryProduct[]> {
    return this.prisma.withTenantContext(tenantId, (tx) =>
      tx.inventoryProduct.findMany({
        where: { tenantId, categoryId, deletedAt: null },
        orderBy: { name: 'asc' },
      }),
    );
  }

  update(tenantId: string, id: string, input: UpdateInventoryProductInput): Promise<InventoryProduct> {
    return this.prisma.withTenantContext(tenantId, (tx) =>
      tx.inventoryProduct.update({
        where: { id },
        data: {
          name: input.name,
          categoryId: input.categoryId,
          barcode: input.barcode,
          description: input.description,
          brand: input.brand,
          manufacturer: input.manufacturer,
          purchasePrice: input.purchasePrice,
          sellingPrice: input.sellingPrice,
          minStockLevel: input.minStockLevel,
          maxStockLevel: input.maxStockLevel,
          imageStorageKey: input.imageStorageKey,
          tracksBatch: input.tracksBatch,
          isActive: input.isActive,
          updatedBy: input.updatedBy,
        },
      }),
    );
  }

  softDelete(tenantId: string, id: string, updatedBy?: string): Promise<InventoryProduct> {
    return this.prisma.withTenantContext(tenantId, (tx) =>
      tx.inventoryProduct.update({ where: { id }, data: { deletedAt: new Date(), updatedBy } }),
    );
  }
}
