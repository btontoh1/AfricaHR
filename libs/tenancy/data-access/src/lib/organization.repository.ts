import { Injectable } from '@nestjs/common';
import { Organization, Prisma } from '@prisma/client';
import { PrismaService } from '@africahr/platform-database';

export interface CreateOrganizationInput {
  legalName: string;
  tradingName?: string;
  countryCode: string;
  registrationNumber: string;
  taxIdentificationNumber?: string;
  metadata?: Prisma.InputJsonValue;
  createdBy?: string;
}

@Injectable()
export class OrganizationRepository {
  constructor(private readonly prisma: PrismaService) {}

  create(tenantId: string, input: CreateOrganizationInput): Promise<Organization> {
    return this.prisma.withTenantContext(tenantId, (tx) =>
      tx.organization.create({
        data: {
          tenantId,
          legalName: input.legalName,
          tradingName: input.tradingName,
          countryCode: input.countryCode,
          registrationNumber: input.registrationNumber,
          taxIdentificationNumber: input.taxIdentificationNumber,
          metadata: input.metadata,
          createdBy: input.createdBy,
          updatedBy: input.createdBy,
        },
      }),
    );
  }

  findById(tenantId: string, id: string): Promise<Organization | null> {
    return this.prisma.withTenantContext(tenantId, (tx) =>
      tx.organization.findFirst({ where: { id, tenantId, deletedAt: null } }),
    );
  }

  listByTenant(tenantId: string): Promise<Organization[]> {
    return this.prisma.withTenantContext(tenantId, (tx) =>
      tx.organization.findMany({
        where: { tenantId, deletedAt: null },
        orderBy: { createdAt: 'asc' },
      }),
    );
  }

  softDelete(tenantId: string, id: string, updatedBy?: string): Promise<Organization> {
    return this.prisma.withTenantContext(tenantId, (tx) =>
      tx.organization.update({
        where: { id },
        data: { deletedAt: new Date(), updatedBy },
      }),
    );
  }
}
