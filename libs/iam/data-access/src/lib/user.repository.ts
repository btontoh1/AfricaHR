import { Injectable } from '@nestjs/common';
import { MfaMethod, SystemRole, User } from '@prisma/client';
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

export interface UserForLogin {
  id: string;
  tenantId: string | null;
  email: string;
  passwordHash: string;
  firstName: string;
  lastName: string;
  role: SystemRole;
  isActive: boolean;
  mfaEnabled: boolean;
  mfaMethod: MfaMethod | null;
  phoneNumber: string | null;
}

@Injectable()
export class UserRepository {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Deliberately bypasses tenant scoping: login only has an email, not yet a
   * tenant, so this is the one lookup that must run unscoped by design (see
   * RLS_CONVENTION.md §4). Under the least-privilege app role, a plain
   * SELECT can't see tenant-scoped rows with no tenant context set, so this
   * goes through find_user_for_login(), a narrow SECURITY DEFINER function
   * (owned by the superuser/owner role) rather than the app role's own
   * (RLS-restricted) read access — see the login-lookup-function migration.
   */
  async findByEmail(email: string): Promise<UserForLogin | null> {
    const rows = await this.prisma.$queryRaw<
      UserForLogin[]
    >`SELECT * FROM find_user_for_login(${email})`;
    return rows[0] ?? null;
  }

  findById(tenantId: string | null, id: string): Promise<User | null> {
    return withScope(this.prisma, tenantId, (client) =>
      client.user.findFirst({ where: { id, deletedAt: null } }),
    );
  }

  /**
   * For tenant-scoped login (see TenantAuthService): unlike findByEmail(),
   * the tenant is already known here, so this runs under real RLS via
   * withScope() instead of the SECURITY DEFINER escape hatch.
   */
  findByEmailInTenant(tenantId: string, email: string): Promise<User | null> {
    return withScope(this.prisma, tenantId, (client) =>
      client.user.findFirst({ where: { tenantId, email, deletedAt: null } }),
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

  /**
   * Stores a newly-generated TOTP secret without enabling MFA yet -
   * mfaEnabled only flips to true once MfaService.confirm() verifies a real
   * code from it, so a setup() call that's never confirmed leaves the
   * account exactly as protected (or not) as before.
   */
  setPendingMfaSecret(tenantId: string | null, id: string, encryptedSecret: string): Promise<User> {
    return withScope(this.prisma, tenantId, (client) =>
      client.user.update({ where: { id }, data: { mfaSecretEncrypted: encryptedSecret } }),
    );
  }

  enableMfa(tenantId: string | null, id: string): Promise<User> {
    return withScope(this.prisma, tenantId, (client) =>
      client.user.update({
        where: { id },
        data: { mfaEnabled: true, mfaEnabledAt: new Date(), mfaMethod: MfaMethod.TOTP },
      }),
    );
  }

  /**
   * Stores a newly-submitted phone number without enabling MFA yet - same
   * "pending before proof" shape as setPendingMfaSecret. phoneNumberVerifiedAt
   * only gets set once MfaService.confirmSms() verifies a real code sent to it.
   */
  setPendingPhoneNumber(tenantId: string | null, id: string, phoneNumber: string): Promise<User> {
    return withScope(this.prisma, tenantId, (client) =>
      client.user.update({ where: { id }, data: { phoneNumber } }),
    );
  }

  enablePhoneMfa(tenantId: string | null, id: string): Promise<User> {
    return withScope(this.prisma, tenantId, (client) =>
      client.user.update({
        where: { id },
        data: {
          mfaEnabled: true,
          mfaEnabledAt: new Date(),
          mfaMethod: MfaMethod.SMS,
          phoneNumberVerifiedAt: new Date(),
        },
      }),
    );
  }

  updatePassword(tenantId: string | null, id: string, passwordHash: string): Promise<User> {
    return withScope(this.prisma, tenantId, (client) =>
      client.user.update({ where: { id }, data: { passwordHash } }),
    );
  }

  /**
   * Fully resets MFA state regardless of which method (TOTP or SMS) was
   * active - a disable() that only cleared TOTP fields would leave a
   * dangling phoneNumber/phoneNumberVerifiedAt behind for an SMS user.
   */
  clearMfa(tenantId: string | null, id: string): Promise<User> {
    return withScope(this.prisma, tenantId, (client) =>
      client.user.update({
        where: { id },
        data: {
          mfaEnabled: false,
          mfaSecretEncrypted: null,
          mfaEnabledAt: null,
          mfaMethod: null,
          phoneNumber: null,
          phoneNumberVerifiedAt: null,
        },
      }),
    );
  }
}
