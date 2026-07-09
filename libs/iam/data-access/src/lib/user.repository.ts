import { Injectable } from '@nestjs/common';
import { SystemRole, User } from '@prisma/client';
import { PrismaService } from '@africahr/platform-database';
import { withScope } from './tenant-scoped';

export interface CreateUserInput {
  tenantId: string | null;
  email: string;
  passwordHash: string;
  firstName: string;
  lastName: string;
  role: SystemRole;
  createdBy?: string;
}

@Injectable()
export class UserRepository {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Deliberately bypasses tenant scoping: login only has an email, not yet a
   * tenant, so this is the one lookup that must run unscoped by design (see
   * RLS_CONVENTION.md §4).
   */
  findByEmail(email: string): Promise<User | null> {
    return this.prisma.user.findFirst({ where: { email, deletedAt: null } });
  }

  findById(tenantId: string | null, id: string): Promise<User | null> {
    return withScope(this.prisma, tenantId, (client) =>
      client.user.findFirst({ where: { id, deletedAt: null } }),
    );
  }

  listByTenant(tenantId: string): Promise<User[]> {
    return withScope(this.prisma, tenantId, (client) =>
      client.user.findMany({
        where: { tenantId, deletedAt: null },
        orderBy: { createdAt: 'asc' },
      }),
    );
  }

  create(input: CreateUserInput): Promise<User> {
    return withScope(this.prisma, input.tenantId, (client) =>
      client.user.create({
        data: {
          tenantId: input.tenantId,
          email: input.email,
          passwordHash: input.passwordHash,
          firstName: input.firstName,
          lastName: input.lastName,
          role: input.role,
          createdBy: input.createdBy,
          updatedBy: input.createdBy,
        },
      }),
    );
  }

  updateLastLogin(tenantId: string | null, id: string): Promise<User> {
    return withScope(this.prisma, tenantId, (client) =>
      client.user.update({ where: { id }, data: { lastLoginAt: new Date() } }),
    );
  }

  updateRole(
    tenantId: string | null,
    id: string,
    role: SystemRole,
    updatedBy?: string,
  ): Promise<User> {
    return withScope(this.prisma, tenantId, (client) =>
      client.user.update({ where: { id }, data: { role, updatedBy } }),
    );
  }

  setActive(
    tenantId: string | null,
    id: string,
    isActive: boolean,
    updatedBy?: string,
  ): Promise<User> {
    return withScope(this.prisma, tenantId, (client) =>
      client.user.update({ where: { id }, data: { isActive, updatedBy } }),
    );
  }

  softDelete(tenantId: string | null, id: string, updatedBy?: string): Promise<User> {
    return withScope(this.prisma, tenantId, (client) =>
      client.user.update({ where: { id }, data: { deletedAt: new Date(), updatedBy } }),
    );
  }
}
