import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import * as argon2 from 'argon2';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { User } from '@prisma/client';
import {
  IMPERSONATION_TOKEN_TTL_SECONDS,
  JwtTokenService,
  RequestUser,
  SystemRole,
  TokenRevocationService,
} from '@africahr/platform-auth';
import { AuditService } from '@africahr/platform-audit';
import { RefreshTokenRepository, UserRepository } from '@africahr/iam-data-access';
import { getPasswordRequirementErrors } from '@africahr/iam-domain';
import { CreateUserDto } from './dto/create-user.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { UpdateUserProfileDto } from './dto/update-user-profile.dto';
import { ImpersonationTokenResponseDto } from './dto/impersonation-token-response.dto';

/**
 * Emitted once an impersonation session is actually issued - lives here,
 * not notifications-feature, because scope:iam cannot depend on
 * scope:notifications (Nx module boundary). notifications-feature's
 * ImpersonationNotificationListener is the other half of this decoupling;
 * both sides must agree on this literal string and payload shape
 * informally, same as every other cross-domain event in this codebase
 * (see e.g. PAYROLL_DISBURSEMENT_FAILED_EVENT).
 */
export const IMPERSONATION_STARTED_EVENT = 'iam.user.impersonation_started';

export interface ImpersonationStartedEventPayload {
  tenantId: string;
  targetUserId: string;
  actingAdminId: string;
  reason: string;
}

@Injectable()
export class UserService {
  constructor(
    private readonly users: UserRepository,
    private readonly refreshTokens: RefreshTokenRepository,
    private readonly revocation: TokenRevocationService,
    private readonly audit: AuditService,
    private readonly tokens: JwtTokenService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async create(dto: CreateUserDto, actor: RequestUser): Promise<User> {
    const tenantId = this.resolveCreateTenantId(dto, actor);
    const organizationId = tenantId
      ? await this.resolveOrganizationId(tenantId, dto.role, dto.organizationId)
      : null;

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
      organizationId,
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

  async updateRole(actor: RequestUser, id: string, role: SystemRole, organizationId?: string): Promise<User> {
    const tenantId = this.requireTenantScope(actor);
    await this.findById(actor, id);

    if (role === SystemRole.PLATFORM_ADMIN) {
      throw new BadRequestException('Cannot assign PLATFORM_ADMIN within a tenant');
    }

    const resolvedOrganizationId = await this.resolveOrganizationId(tenantId, role, organizationId);
    const user = await this.users.updateRole(tenantId, id, role, resolvedOrganizationId, actor.sub);

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

  async updateProfile(actor: RequestUser, id: string, dto: UpdateUserProfileDto): Promise<User> {
    const tenantId = this.requireTenantScope(actor);
    await this.findById(actor, id);

    if (dto.email) {
      await this.assertEmailAvailable(dto.email, id);
    }

    const user = await this.users.updateProfile(tenantId, id, dto, actor.sub);

    await this.audit.record({
      tenantId,
      actorUserId: actor.sub,
      action: 'user.profile_updated',
      resourceType: 'User',
      resourceId: id,
    });

    return user;
  }

  /**
   * Admin-initiated reset for a user who lost/forgot their password - unlike
   * changePassword() above, no currentPassword is required (the whole point
   * is the account holder can't provide one), but the same
   * revoke-everywhere posture applies: a stale session on the old password
   * shouldn't keep working after an admin has issued a new one.
   */
  async adminResetPassword(actor: RequestUser, id: string, newPassword: string): Promise<User> {
    const tenantId = this.requireTenantScope(actor);
    await this.findById(actor, id);

    const passwordErrors = getPasswordRequirementErrors(newPassword);
    if (passwordErrors.length > 0) {
      throw new BadRequestException(passwordErrors);
    }

    const passwordHash = await argon2.hash(newPassword);
    const user = await this.users.updatePassword(tenantId, id, passwordHash);

    await this.refreshTokens.revokeAllForUser(tenantId, id);
    await this.revocation.revokeAllForUser(id);

    await this.audit.record({
      tenantId,
      actorUserId: actor.sub,
      action: 'user.password_reset_by_admin',
      resourceType: 'User',
      resourceId: id,
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
   * Self-service password change - unlike the tenant-scoped methods above,
   * this works for any actor including a platform admin (tenantId: null),
   * since it acts on the caller's own account rather than a tenant-scoped
   * resource. Requires the current password (same re-auth posture as
   * MfaService.disable()) and then forces re-login everywhere: a hijacked
   * session shouldn't be able to change the password and keep using the
   * account under the old, now-superseded credential.
   */
  async changePassword(actor: RequestUser, dto: ChangePasswordDto): Promise<void> {
    const user = await this.users.findById(actor.tenantId, actor.sub);
    if (!user) {
      throw new UnauthorizedException('Account no longer exists');
    }

    const currentValid = await argon2.verify(user.passwordHash, dto.currentPassword);
    if (!currentValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const passwordErrors = getPasswordRequirementErrors(dto.newPassword);
    if (passwordErrors.length > 0) {
      throw new BadRequestException(passwordErrors);
    }

    const passwordHash = await argon2.hash(dto.newPassword);
    await this.users.updatePassword(actor.tenantId, actor.sub, passwordHash);

    await this.refreshTokens.revokeAllForUser(actor.tenantId, actor.sub);
    await this.revocation.revokeAllForUser(actor.sub);

    await this.audit.record({
      tenantId: actor.tenantId,
      actorUserId: actor.sub,
      action: 'user.password_changed',
      resourceType: 'User',
      resourceId: actor.sub,
    });
  }

  /**
   * Platform-admin-only counterparts to list/updateRole/setActive above,
   * for an arbitrary tenant rather than the actor's own (there is no
   * actor.tenantId to scope by — see requireTenantScope). The route these
   * back is gated by PLATFORM_TENANT_MANAGE, so by the time control
   * reaches here the caller is already known to be a platform admin; that
   * permission check is the real enforcement, not anything in this class.
   */
  listForTenant(tenantId: string): Promise<User[]> {
    return this.users.listByTenant(tenantId);
  }

  async updateProfileForTenant(
    tenantId: string,
    id: string,
    dto: UpdateUserProfileDto,
    actorId?: string,
  ): Promise<User> {
    const existing = await this.users.findById(tenantId, id);
    if (!existing) {
      throw new NotFoundException(`User "${id}" not found`);
    }
    if (dto.email) {
      await this.assertEmailAvailable(dto.email, id);
    }

    const user = await this.users.updateProfile(tenantId, id, dto, actorId);

    await this.audit.record({
      tenantId,
      actorUserId: actorId ?? null,
      action: 'user.profile_updated',
      resourceType: 'User',
      resourceId: id,
    });

    return user;
  }

  async adminResetPasswordForTenant(
    tenantId: string,
    id: string,
    newPassword: string,
    actorId?: string,
  ): Promise<User> {
    const existing = await this.users.findById(tenantId, id);
    if (!existing) {
      throw new NotFoundException(`User "${id}" not found`);
    }

    const passwordErrors = getPasswordRequirementErrors(newPassword);
    if (passwordErrors.length > 0) {
      throw new BadRequestException(passwordErrors);
    }

    const passwordHash = await argon2.hash(newPassword);
    const user = await this.users.updatePassword(tenantId, id, passwordHash);

    await this.refreshTokens.revokeAllForUser(tenantId, id);
    await this.revocation.revokeAllForUser(id);

    await this.audit.record({
      tenantId,
      actorUserId: actorId ?? null,
      action: 'user.password_reset_by_admin',
      resourceType: 'User',
      resourceId: id,
    });

    return user;
  }

  async updateRoleForTenant(
    tenantId: string,
    id: string,
    role: SystemRole,
    actorId?: string,
    organizationId?: string,
  ): Promise<User> {
    const existing = await this.users.findById(tenantId, id);
    if (!existing) {
      throw new NotFoundException(`User "${id}" not found`);
    }
    if (role === SystemRole.PLATFORM_ADMIN) {
      throw new BadRequestException('Cannot assign PLATFORM_ADMIN within a tenant');
    }

    const resolvedOrganizationId = await this.resolveOrganizationId(tenantId, role, organizationId);
    const user = await this.users.updateRole(tenantId, id, role, resolvedOrganizationId, actorId);

    await this.audit.record({
      tenantId,
      actorUserId: actorId ?? null,
      action: 'user.role_changed',
      resourceType: 'User',
      resourceId: id,
      metadata: { role },
    });

    return user;
  }

  async setActiveForTenant(tenantId: string, id: string, isActive: boolean, actorId?: string): Promise<User> {
    const existing = await this.users.findById(tenantId, id);
    if (!existing) {
      throw new NotFoundException(`User "${id}" not found`);
    }

    const user = await this.users.setActive(tenantId, id, isActive, actorId);

    await this.audit.record({
      tenantId,
      actorUserId: actorId ?? null,
      action: isActive ? 'user.activated' : 'user.deactivated',
      resourceType: 'User',
      resourceId: id,
    });

    return user;
  }

  /**
   * Issues a short-lived (see JwtTokenService.signImpersonationToken), read-
   * only (see JwtAuthGuard) access token for `id`, carrying an `act` claim
   * naming `actor` - the platform admin actually driving the session, per
   * RFC 8693's actor-claim pattern. Deliberately never touches the actor's
   * own password, session, or refresh token: the point is that the admin
   * never learns or uses the target's credentials at all.
   *
   * No session row is created and there is no corresponding "end"
   * endpoint - ending impersonation is purely a client-side matter (the
   * frontend simply refreshes back to its own, never-touched refresh
   * token; see apps/web/src/app/api/auth/impersonate/route.ts's doc
   * comment). What IS recorded, synchronously, before this returns: an
   * audit entry attributed to the admin (not the target), and - via
   * IMPERSONATION_STARTED_EVENT - a notice to the impersonated user, so
   * this is never a silent capability.
   */
  async impersonateForTenant(
    tenantId: string,
    id: string,
    reason: string,
    actor: RequestUser,
  ): Promise<ImpersonationTokenResponseDto> {
    const target = await this.users.findById(tenantId, id);
    if (!target) {
      throw new NotFoundException(`User "${id}" not found`);
    }
    if (!target.isActive) {
      throw new BadRequestException('Cannot impersonate a deactivated user');
    }

    const accessToken = this.tokens.signImpersonationToken({
      sub: target.id,
      email: target.email,
      role: target.role,
      tenantId: target.tenantId,
      organizationId: target.organizationId,
      act: { sub: actor.sub, email: actor.email },
    });

    await this.audit.record({
      tenantId,
      actorUserId: actor.sub,
      action: 'user.impersonation_started',
      resourceType: 'User',
      resourceId: target.id,
      metadata: { targetEmail: target.email, reason },
    });

    this.eventEmitter.emit(IMPERSONATION_STARTED_EVENT, {
      tenantId,
      targetUserId: target.id,
      actingAdminId: actor.sub,
      reason,
    } satisfies ImpersonationStartedEventPayload);

    return { accessToken, expiresInSeconds: IMPERSONATION_TOKEN_TTL_SECONDS };
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
   * ORG_ADMIN requires an organizationId that actually belongs to
   * tenantId; every other role must not carry one (a stray org id sitting
   * on a tenant-wide role's JWT would be meaningless and confusing, so
   * it's rejected rather than silently dropped).
   */
  private async resolveOrganizationId(
    tenantId: string,
    role: SystemRole,
    organizationId?: string,
  ): Promise<string | null> {
    if (role !== SystemRole.ORG_ADMIN) {
      if (organizationId) {
        throw new BadRequestException('organizationId is only accepted when role is ORG_ADMIN');
      }
      return null;
    }

    if (!organizationId) {
      throw new BadRequestException('organizationId is required when role is ORG_ADMIN');
    }

    const belongsToTenant = await this.users.organizationExistsInTenant(tenantId, organizationId);
    if (!belongsToTenant) {
      throw new NotFoundException(`Organization "${organizationId}" not found`);
    }

    return organizationId;
  }

  /**
   * findByEmail() is global (not tenant-scoped, see UserRepository's own
   * doc comment), same lookup create() already uses - a changed email must
   * be unique platform-wide, not just within the acting tenant.
   */
  private async assertEmailAvailable(email: string, id: string): Promise<void> {
    const existing = await this.users.findByEmail(email);
    if (existing && existing.id !== id) {
      throw new ConflictException(`Email "${email}" is already in use`);
    }
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
