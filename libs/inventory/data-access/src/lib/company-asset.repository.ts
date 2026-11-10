import { Injectable } from '@nestjs/common';
import { CompanyAsset, CompanyAssetStatus } from '@prisma/client';
import { PrismaService } from '@africahr/platform-database';

export interface CreateCompanyAssetInput {
  organizationId: string;
  assetTag: string;
  name: string;
  category?: string;
  serialNumber?: string;
  purchaseDate?: Date;
  purchasePrice?: number;
  notes?: string;
  createdBy?: string;
}

export interface UpdateCompanyAssetInput {
  name?: string;
  category?: string | null;
  serialNumber?: string | null;
  purchaseDate?: Date | null;
  purchasePrice?: number | null;
  notes?: string | null;
  isActive?: boolean;
  updatedBy?: string;
}

@Injectable()
export class CompanyAssetRepository {
  constructor(private readonly prisma: PrismaService) {}

  create(tenantId: string, input: CreateCompanyAssetInput): Promise<CompanyAsset> {
    return this.prisma.withTenantContext(tenantId, (tx) =>
      tx.companyAsset.create({
        data: {
          tenantId,
          organizationId: input.organizationId,
          assetTag: input.assetTag,
          name: input.name,
          category: input.category,
          serialNumber: input.serialNumber,
          purchaseDate: input.purchaseDate,
          purchasePrice: input.purchasePrice,
          notes: input.notes,
          createdBy: input.createdBy,
          updatedBy: input.createdBy,
        },
      }),
    );
  }

  findById(tenantId: string, id: string): Promise<CompanyAsset | null> {
    return this.prisma.withTenantContext(tenantId, (tx) =>
      tx.companyAsset.findFirst({ where: { id, tenantId, deletedAt: null } }),
    );
  }

  findByAssetTag(tenantId: string, assetTag: string): Promise<CompanyAsset | null> {
    return this.prisma.withTenantContext(tenantId, (tx) =>
      tx.companyAsset.findFirst({ where: { tenantId, assetTag, deletedAt: null } }),
    );
  }

  list(
    tenantId: string,
    filters: { organizationId?: string; status?: CompanyAssetStatus; assignedEmployeeId?: string } = {},
  ): Promise<CompanyAsset[]> {
    return this.prisma.withTenantContext(tenantId, (tx) =>
      tx.companyAsset.findMany({
        where: {
          tenantId,
          organizationId: filters.organizationId,
          status: filters.status,
          assignedEmployeeId: filters.assignedEmployeeId,
          deletedAt: null,
        },
        orderBy: { name: 'asc' },
      }),
    );
  }

  update(tenantId: string, id: string, input: UpdateCompanyAssetInput): Promise<CompanyAsset> {
    return this.prisma.withTenantContext(tenantId, (tx) =>
      tx.companyAsset.update({
        where: { id },
        data: {
          name: input.name,
          category: input.category,
          serialNumber: input.serialNumber,
          purchaseDate: input.purchaseDate,
          purchasePrice: input.purchasePrice,
          notes: input.notes,
          isActive: input.isActive,
          updatedBy: input.updatedBy,
        },
      }),
    );
  }

  softDelete(tenantId: string, id: string, updatedBy?: string): Promise<CompanyAsset> {
    return this.prisma.withTenantContext(tenantId, (tx) =>
      tx.companyAsset.update({ where: { id }, data: { deletedAt: new Date(), updatedBy } }),
    );
  }

  /** Admin-set status transitions (MAINTENANCE/RETIRED/back to AVAILABLE) that aren't tied to an assignment - assign()/returnAsset() own the ASSIGNED<->AVAILABLE transitions themselves. */
  updateStatus(tenantId: string, id: string, status: CompanyAssetStatus, updatedBy?: string): Promise<CompanyAsset> {
    return this.prisma.withTenantContext(tenantId, (tx) =>
      tx.companyAsset.update({ where: { id }, data: { status, updatedBy } }),
    );
  }
}
