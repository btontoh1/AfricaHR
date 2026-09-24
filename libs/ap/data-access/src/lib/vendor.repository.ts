import { Injectable } from '@nestjs/common';
import { Vendor } from '@prisma/client';
import { PrismaService } from '@africahr/platform-database';

export interface CreateVendorInput {
  organizationId: string;
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  createdBy?: string;
}

export interface UpdateVendorInput {
  name?: string;
  email?: string;
  phone?: string;
  address?: string;
  updatedBy?: string;
}

@Injectable()
export class VendorRepository {
  constructor(private readonly prisma: PrismaService) {}

  create(tenantId: string, input: CreateVendorInput): Promise<Vendor> {
    return this.prisma.withTenantContext(tenantId, (tx) =>
      tx.vendor.create({
        data: {
          tenantId,
          organizationId: input.organizationId,
          name: input.name,
          email: input.email,
          phone: input.phone,
          address: input.address,
          createdBy: input.createdBy,
          updatedBy: input.createdBy,
        },
      }),
    );
  }

  findById(tenantId: string, id: string): Promise<Vendor | null> {
    return this.prisma.withTenantContext(tenantId, (tx) =>
      tx.vendor.findFirst({ where: { id, tenantId, deletedAt: null } }),
    );
  }

  list(tenantId: string, organizationId?: string): Promise<Vendor[]> {
    return this.prisma.withTenantContext(tenantId, (tx) =>
      tx.vendor.findMany({
        where: { tenantId, organizationId, deletedAt: null },
        orderBy: { name: 'asc' },
      }),
    );
  }

  update(tenantId: string, id: string, input: UpdateVendorInput): Promise<Vendor> {
    return this.prisma.withTenantContext(tenantId, (tx) =>
      tx.vendor.update({
        where: { id },
        data: {
          name: input.name,
          email: input.email,
          phone: input.phone,
          address: input.address,
          updatedBy: input.updatedBy,
        },
      }),
    );
  }

  softDelete(tenantId: string, id: string, updatedBy?: string): Promise<Vendor> {
    return this.prisma.withTenantContext(tenantId, (tx) =>
      tx.vendor.update({
        where: { id },
        data: { deletedAt: new Date(), updatedBy },
      }),
    );
  }
}
