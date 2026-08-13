import { Injectable, NotFoundException } from '@nestjs/common';
import { Customer, Prisma } from '@prisma/client';
import { AuditService } from '@africahr/platform-audit';
import { assertOrganizationScope, RequestUser, SystemRole } from '@africahr/platform-auth';
import { CustomerRepository } from '@africahr/invoicing-data-access';
import { CreateCustomerDto } from './dto/create-customer.dto';
import { UpdateCustomerDto } from './dto/update-customer.dto';

/**
 * Customer references organizationId (owned by the Tenancy bounded
 * context) - but scope:invoicing can only depend on scope:invoicing +
 * scope:platform, not scope:tenancy as a peer. Same reasoning as
 * employee-feature's translateReferenceError: rely on the database's own
 * foreign-key constraint and translate the failure here, rather than reach
 * across bounded contexts.
 */
function translateReferenceError(error: unknown, organizationId: string): never {
  if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2003') {
    throw new NotFoundException(`Organization "${organizationId}" not found`);
  }
  throw error;
}

@Injectable()
export class CustomerService {
  constructor(
    private readonly customers: CustomerRepository,
    private readonly audit: AuditService,
  ) {}

  async create(tenantId: string, dto: CreateCustomerDto, actor: RequestUser): Promise<Customer> {
    assertOrganizationScope(actor, dto.organizationId);

    let customer: Customer;
    try {
      customer = await this.customers.create(tenantId, {
        organizationId: dto.organizationId,
        name: dto.name,
        email: dto.email,
        phone: dto.phone,
        billingAddress: dto.billingAddress,
        createdBy: actor.sub,
      });
    } catch (error) {
      translateReferenceError(error, dto.organizationId);
    }

    await this.audit.record({
      tenantId,
      actorUserId: actor.sub ?? null,
      action: 'customer.created',
      resourceType: 'Customer',
      resourceId: customer.id,
    });

    return customer;
  }

  async findById(tenantId: string, id: string, actor: RequestUser): Promise<Customer> {
    return this.findCustomerOrThrow(tenantId, id, actor);
  }

  list(tenantId: string, organizationId: string | undefined, actor: RequestUser): Promise<Customer[]> {
    // ORG_ADMIN is hard-scoped to their own organization regardless of what
    // was requested - same pattern as EmployeeService.list.
    const scopedOrganizationId =
      actor.role === SystemRole.ORG_ADMIN ? (actor.organizationId ?? undefined) : organizationId;
    return this.customers.list(tenantId, scopedOrganizationId);
  }

  async update(tenantId: string, id: string, dto: UpdateCustomerDto, actor: RequestUser): Promise<Customer> {
    await this.findCustomerOrThrow(tenantId, id, actor);

    const updated = await this.customers.update(tenantId, id, {
      name: dto.name,
      email: dto.email,
      phone: dto.phone,
      billingAddress: dto.billingAddress,
      updatedBy: actor.sub,
    });

    await this.audit.record({
      tenantId,
      actorUserId: actor.sub ?? null,
      action: 'customer.updated',
      resourceType: 'Customer',
      resourceId: id,
    });

    return updated;
  }

  async softDelete(tenantId: string, id: string, actor: RequestUser): Promise<Customer> {
    await this.findCustomerOrThrow(tenantId, id, actor);
    const deleted = await this.customers.softDelete(tenantId, id, actor.sub);

    await this.audit.record({
      tenantId,
      actorUserId: actor.sub ?? null,
      action: 'customer.deleted',
      resourceType: 'Customer',
      resourceId: id,
    });

    return deleted;
  }

  /**
   * Internal lookup enforcing ORG_ADMIN scoping for every id-addressed
   * route (findById/update/softDelete) - those routes only carry `id`, not
   * organizationId, so the check can only happen after the row is fetched.
   * Also used by CustomerInvoiceService to validate a customerId belongs to
   * the same organization as the invoice being created for it.
   */
  async findCustomerOrThrow(tenantId: string, id: string, actor: RequestUser): Promise<Customer> {
    const customer = await this.customers.findById(tenantId, id);
    if (!customer) {
      throw new NotFoundException(`Customer "${id}" not found`);
    }
    assertOrganizationScope(actor, customer.organizationId);
    return customer;
  }
}
