import { Injectable } from '@nestjs/common';
import { Customer } from '@prisma/client';
import { PrismaService } from '@africahr/platform-database';

export interface CreateCustomerInput {
  organizationId: string;
  name: string;
  email?: string;
  phone?: string;
  billingAddress?: string;
  createdBy?: string;
}

export interface UpdateCustomerInput {
  name?: string;
  email?: string;
  phone?: string;
  billingAddress?: string;
  updatedBy?: string;
}

@Injectable()
export class CustomerRepository {
  constructor(private readonly prisma: PrismaService) {}

  create(tenantId: string, input: CreateCustomerInput): Promise<Customer> {
    return this.prisma.withTenantContext(tenantId, (tx) =>
      tx.customer.create({
        data: {
          tenantId,
          organizationId: input.organizationId,
          name: input.name,
          email: input.email,
          phone: input.phone,
          billingAddress: input.billingAddress,
          createdBy: input.createdBy,
          updatedBy: input.createdBy,
        },
      }),
    );
  }

  findById(tenantId: string, id: string): Promise<Customer | null> {
    return this.prisma.withTenantContext(tenantId, (tx) =>
      tx.customer.findFirst({ where: { id, tenantId, deletedAt: null } }),
    );
  }

  list(tenantId: string, organizationId?: string): Promise<Customer[]> {
    return this.prisma.withTenantContext(tenantId, (tx) =>
      tx.customer.findMany({
        where: { tenantId, organizationId, deletedAt: null },
        orderBy: { name: 'asc' },
      }),
    );
  }

  update(tenantId: string, id: string, input: UpdateCustomerInput): Promise<Customer> {
    return this.prisma.withTenantContext(tenantId, (tx) =>
      tx.customer.update({
        where: { id },
        data: {
          name: input.name,
          email: input.email,
          phone: input.phone,
          billingAddress: input.billingAddress,
          updatedBy: input.updatedBy,
        },
      }),
    );
  }

  softDelete(tenantId: string, id: string, updatedBy?: string): Promise<Customer> {
    return this.prisma.withTenantContext(tenantId, (tx) =>
      tx.customer.update({
        where: { id },
        data: { deletedAt: new Date(), updatedBy },
      }),
    );
  }
}
