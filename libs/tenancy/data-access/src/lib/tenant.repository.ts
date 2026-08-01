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

  /** Newest first - a separate method rather than a param on list() above, so that method's existing callers/ordering are untouched. */
  listRecent(take: number): Promise<Tenant[]> {
    return this.prisma.tenant.findMany({
      where: { deletedAt: null },
      orderBy: { createdAt: 'desc' },
      take,
    });
  }

  count(): Promise<number> {
    return this.prisma.tenant.count({ where: { deletedAt: null } });
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

  updateLogo(id: string, logoStorageKey: string | null, updatedBy?: string): Promise<Tenant> {
    return this.prisma.tenant.update({
      where: { id },
      data: { logoStorageKey, updatedBy },
    });
  }
}
