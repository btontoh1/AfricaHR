import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma, Vendor } from '@prisma/client';
import { AuditService } from '@africahr/platform-audit';
import { assertOrganizationScope, RequestUser, SystemRole } from '@africahr/platform-auth';
import { VendorRepository } from '@africahr/ap-data-access';
import { CreateVendorDto } from './dto/create-vendor.dto';
import { UpdateVendorDto } from './dto/update-vendor.dto';

/**
 * Vendor references organizationId (owned by the Tenancy bounded context) -
 * but scope:ap can only depend on scope:ap + scope:platform, not
 * scope:tenancy as a peer. Same reasoning as invoicing-feature's
 * CustomerService.translateReferenceError.
 */
function translateReferenceError(error: unknown, organizationId: string): never {
  if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2003') {
    throw new NotFoundException(`Organization "${organizationId}" not found`);
  }
  throw error;
}

@Injectable()
export class VendorService {
  constructor(
    private readonly vendors: VendorRepository,
    private readonly audit: AuditService,
  ) {}

  async create(tenantId: string, dto: CreateVendorDto, actor: RequestUser): Promise<Vendor> {
    assertOrganizationScope(actor, dto.organizationId);

    let vendor: Vendor;
    try {
      vendor = await this.vendors.create(tenantId, {
        organizationId: dto.organizationId,
        name: dto.name,
        email: dto.email,
        phone: dto.phone,
        address: dto.address,
        createdBy: actor.sub,
      });
    } catch (error) {
      translateReferenceError(error, dto.organizationId);
    }

    await this.audit.record({
      tenantId,
      actorUserId: actor.sub ?? null,
      action: 'vendor.created',
      resourceType: 'Vendor',
      resourceId: vendor.id,
    });

    return vendor;
  }

  async findById(tenantId: string, id: string, actor: RequestUser): Promise<Vendor> {
    return this.findVendorOrThrow(tenantId, id, actor);
  }

  list(tenantId: string, organizationId: string | undefined, actor: RequestUser): Promise<Vendor[]> {
    // ORG_ADMIN is hard-scoped to their own organization regardless of what
    // was requested - same pattern as CustomerService.list.
    const scopedOrganizationId =
      actor.role === SystemRole.ORG_ADMIN ? (actor.organizationId ?? undefined) : organizationId;
    return this.vendors.list(tenantId, scopedOrganizationId);
  }

  async update(tenantId: string, id: string, dto: UpdateVendorDto, actor: RequestUser): Promise<Vendor> {
    await this.findVendorOrThrow(tenantId, id, actor);

    const updated = await this.vendors.update(tenantId, id, {
      name: dto.name,
      email: dto.email,
      phone: dto.phone,
      address: dto.address,
      updatedBy: actor.sub,
    });

    await this.audit.record({
      tenantId,
      actorUserId: actor.sub ?? null,
      action: 'vendor.updated',
      resourceType: 'Vendor',
      resourceId: id,
    });

    return updated;
  }

  async softDelete(tenantId: string, id: string, actor: RequestUser): Promise<Vendor> {
    await this.findVendorOrThrow(tenantId, id, actor);
    const deleted = await this.vendors.softDelete(tenantId, id, actor.sub);

    await this.audit.record({
      tenantId,
      actorUserId: actor.sub ?? null,
      action: 'vendor.deleted',
      resourceType: 'Vendor',
      resourceId: id,
    });

    return deleted;
  }

  /**
   * Internal lookup enforcing ORG_ADMIN scoping for every id-addressed route
   * (findById/update/softDelete) - those routes only carry `id`, not
   * organizationId, so the check can only happen after the row is fetched.
   * Also used by VendorBillService to validate a vendorId belongs to the
   * same organization as the bill being created for it.
   */
  async findVendorOrThrow(tenantId: string, id: string, actor: RequestUser): Promise<Vendor> {
    const vendor = await this.vendors.findById(tenantId, id);
    if (!vendor) {
      throw new NotFoundException(`Vendor "${id}" not found`);
    }
    assertOrganizationScope(actor, vendor.organizationId);
    return vendor;
  }
}
