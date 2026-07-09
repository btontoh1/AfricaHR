import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { Tenant } from '@prisma/client';
import { TenantRepository } from '@africahr/tenancy-data-access';
import { canTransitionTenantStatus, isValidSlug, slugify, TenantStatus } from '@africahr/tenancy-domain';
import { CreateTenantDto } from './dto/create-tenant.dto';

@Injectable()
export class TenantService {
  constructor(private readonly tenants: TenantRepository) {}

  async create(dto: CreateTenantDto, actorId?: string): Promise<Tenant> {
    const slug = dto.slug ? dto.slug : slugify(dto.name);

    if (!isValidSlug(slug)) {
      throw new ConflictException(`"${slug}" is not a valid tenant slug`);
    }

    const existing = await this.tenants.findBySlug(slug);
    if (existing) {
      throw new ConflictException(`Tenant slug "${slug}" is already in use`);
    }

    return this.tenants.create({
      name: dto.name,
      slug,
      country: dto.country,
      currency: dto.currency,
      timezone: dto.timezone,
      createdBy: actorId,
    });
  }

  async findById(id: string): Promise<Tenant> {
    const tenant = await this.tenants.findById(id);
    if (!tenant) {
      throw new NotFoundException(`Tenant "${id}" not found`);
    }
    return tenant;
  }

  list(params: { skip?: number; take?: number } = {}): Promise<Tenant[]> {
    return this.tenants.list(params);
  }

  async updateStatus(id: string, status: TenantStatus, actorId?: string): Promise<Tenant> {
    const tenant = await this.findById(id);

    if (!canTransitionTenantStatus(tenant.status, status)) {
      throw new ConflictException(`Cannot transition tenant from ${tenant.status} to ${status}`);
    }

    return this.tenants.updateStatus(id, status, actorId);
  }

  async softDelete(id: string, actorId?: string): Promise<Tenant> {
    await this.findById(id);
    return this.tenants.softDelete(id, actorId);
  }
}
