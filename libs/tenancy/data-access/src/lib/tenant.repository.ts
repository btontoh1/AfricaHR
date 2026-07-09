import { Injectable } from '@nestjs/common';
import { Prisma, Tenant, TenantStatus } from '@prisma/client';
import { PrismaService } from '@africahr/platform-database';

export interface CreateTenantInput {
  name: string;
  slug: string;
  country: string;
  currency: string;
  timezone: string;
  createdBy?: string;
}

@Injectable()
export class TenantRepository {
  constructor(private readonly prisma: PrismaService) {}

  create(input: CreateTenantInput): Promise<Tenant> {
    return this.prisma.tenant.create({
      data: {
        name: input.name,
        slug: input.slug,
        country: input.country,
        currency: input.currency,
        timezone: input.timezone,
        createdBy: input.createdBy,
        updatedBy: input.createdBy,
      },
    });
  }

  findById(id: string): Promise<Tenant | null> {
    return this.prisma.tenant.findFirst({ where: { id, deletedAt: null } });
  }

  findBySlug(slug: string): Promise<Tenant | null> {
    return this.prisma.tenant.findFirst({ where: { slug, deletedAt: null } });
  }

  list(params: { skip?: number; take?: number } = {}): Promise<Tenant[]> {
    return this.prisma.tenant.findMany({
      where: { deletedAt: null },
      orderBy: { createdAt: 'asc' },
      skip: params.skip,
      take: params.take,
    });
  }

  updateStatus(id: string, status: TenantStatus, updatedBy?: string): Promise<Tenant> {
    return this.prisma.tenant.update({
      where: { id },
      data: { status, updatedBy },
    });
  }

  softDelete(id: string, updatedBy?: string): Promise<Tenant> {
    return this.prisma.tenant.update({
      where: { id },
      data: { deletedAt: new Date(), updatedBy } satisfies Prisma.TenantUpdateInput,
    });
  }
}
