import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import * as argon2 from 'argon2';
import { User } from '@prisma/client';
import { RequestUser, SystemRole } from '@africahr/platform-auth';
import { AuditService } from '@africahr/platform-audit';
import { UserRepository } from '@africahr/iam-data-access';
import { getPasswordRequirementErrors } from '@africahr/iam-domain';
import { CreateUserDto } from './dto/create-user.dto';

@Injectable()
export class UserService {
  constructor(
    private readonly users: UserRepository,
    private readonly audit: AuditService,
  ) {}

  async create(dto: CreateUserDto, actor: RequestUser): Promise<User> {
    const tenantId = this.resolveCreateTenantId(dto, actor);

    const passwordErrors = getPasswordRequirementErrors(dto.password);
    if (passwordErrors.length > 0) {
      throw new BadRequestException(passwordErrors);
    }

    const existing = await this.users.findByEmail(dto.email);
    if (existing) {
      throw new ConflictException(`Email "${dto.email}" is already in use`);
    }

    const passwordHash = await argon2.hash(dto.password);

    const user = await this.users.create({
      tenantId,
      email: dto.email,
      passwordHash,
      firstName: dto.firstName,
      lastName: dto.lastName,
      role: dto.role,
      createdBy: actor.sub,
    });

    await this.audit.record({
      tenantId,
      actorUserId: actor.sub,
      action: 'user.created',
      resourceType: 'User',
      resourceId: user.id,
    });

    return user;
  }

  async findById(actor: RequestUser, id: string): Promise<User> {
    const tenantId = this.requireTenantScope(actor);
    const user = await this.users.findById(tenantId, id);
    if (!user) {
      throw new NotFoundException(`User "${id}" not found`);
    }
    return user;
  }

  list(actor: RequestUser): Promise<User[]> {
    const tenantId = this.requireTenantScope(actor);
    return this.users.listByTenant(tenantId);
  }

  async updateRole(actor: RequestUser, id: string, role: SystemRole): Promise<User> {
    const tenantId = this.requireTenantScope(actor);
    await this.findById(actor, id);

    if (role === SystemRole.PLATFORM_ADMIN) {
      throw new BadRequestException('Cannot assign PLATFORM_ADMIN within a tenant');
    }

    const user = await this.users.updateRole(tenantId, id, role, actor.sub);

    await this.audit.record({
      tenantId,
      actorUserId: actor.sub,
      action: 'user.role_changed',
      resourceType: 'User',
      resourceId: id,
      metadata: { role },
    });

    return user;
  }

  async setActive(actor: RequestUser, id: string, isActive: boolean): Promise<User> {
    const tenantId = this.requireTenantScope(actor);
    await this.findById(actor, id);

    const user = await this.users.setActive(tenantId, id, isActive, actor.sub);

    await this.audit.record({
      tenantId,
      actorUserId: actor.sub,
      action: isActive ? 'user.activated' : 'user.deactivated',
      resourceType: 'User',
      resourceId: id,
    });

    return user;
  }

  async softDelete(actor: RequestUser, id: string): Promise<User> {
    const tenantId = this.requireTenantScope(actor);
    await this.findById(actor, id);

    const user = await this.users.softDelete(tenantId, id, actor.sub);

    await this.audit.record({
      tenantId,
      actorUserId: actor.sub,
      action: 'user.deleted',
      resourceType: 'User',
      resourceId: id,
    });

    return user;
  }

  /**
   * Platform admins may create the first user for a tenant they've just
   * provisioned (or another platform admin, by omitting tenantId) — this is
   * the one case where the actor's own tenant isn't the target tenant.
   * Tenant admins can only ever create users in their own tenant, and can
   * never create another PLATFORM_ADMIN.
   */
  private resolveCreateTenantId(dto: CreateUserDto, actor: RequestUser): string | null {
    if (actor.role === SystemRole.PLATFORM_ADMIN) {
      if (dto.role === SystemRole.PLATFORM_ADMIN) {
        return null;
      }
      if (!dto.tenantId) {
        throw new BadRequestException('tenantId is required when creating a non-platform-admin user');
      }
      return dto.tenantId;
    }

    if (dto.role === SystemRole.PLATFORM_ADMIN) {
      throw new BadRequestException('Only a platform admin can create a PLATFORM_ADMIN user');
    }

    return this.requireTenantScope(actor);
  }

  /**
   * Read/update/delete operations in this service always operate on the
   * actor's own tenant — there is no cross-tenant browse for platform admins
   * here (a deliberate v1 scope cut; see project memory).
   */
  private requireTenantScope(actor: RequestUser): string {
    if (!actor.tenantId) {
      throw new BadRequestException('This operation requires a tenant-scoped actor');
    }
    return actor.tenantId;
  }
}
