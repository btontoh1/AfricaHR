import { BadRequestException, ConflictException, NotFoundException, UnauthorizedException } from '@nestjs/common';
import * as argon2 from 'argon2';
import { User } from '@prisma/client';
import { RequestUser, SystemRole, TokenRevocationService } from '@africahr/platform-auth';
import { AuditService } from '@africahr/platform-audit';
import { RefreshTokenRepository, UserRepository } from '@africahr/iam-data-access';
import { UserService } from './user.service';
import { CreateUserDto } from './dto/create-user.dto';

jest.mock('argon2');

describe('UserService', () => {
  let service: UserService;
  let users: jest.Mocked<UserRepository>;
  let refreshTokens: jest.Mocked<RefreshTokenRepository>;
  let revocation: jest.Mocked<TokenRevocationService>;
  let audit: jest.Mocked<AuditService>;

  const validPassword = 'CorrectHorse9';

  const tenantAdmin: RequestUser = {
    sub: 'actor-1',
    email: 'admin@acme.com',
    role: SystemRole.TENANT_ADMIN,
    tenantId: 'tenant-1',
    organizationId: null,
    iat: 1,
    exp: 2,
  };

  const platformAdmin: RequestUser = {
    sub: 'actor-2',
    email: 'ops@africahr.com',
    role: SystemRole.PLATFORM_ADMIN,
    tenantId: null,
    organizationId: null,
    iat: 1,
    exp: 2,
  };

  function makeDto(overrides: Partial<CreateUserDto> = {}): CreateUserDto {
    return {
      email: 'new@acme.com',
      password: validPassword,
      firstName: 'Ama',
      lastName: 'Owusu',
      role: SystemRole.EMPLOYEE,
      ...overrides,
    };
  }

  beforeEach(() => {
    users = {
      findByEmail: jest.fn(),
      findById: jest.fn(),
      listByTenant: jest.fn(),
      create: jest.fn(),
      updateRole: jest.fn(),
      updateProfile: jest.fn(),
      setActive: jest.fn(),
      softDelete: jest.fn(),
      updatePassword: jest.fn(),
      organizationExistsInTenant: jest.fn(),
    } as unknown as jest.Mocked<UserRepository>;

    refreshTokens = { revokeAllForUser: jest.fn() } as unknown as jest.Mocked<RefreshTokenRepository>;
    revocation = { revokeAllForUser: jest.fn() } as unknown as jest.Mocked<TokenRevocationService>;
    audit = { record: jest.fn().mockResolvedValue(undefined) } as unknown as jest.Mocked<AuditService>;

    (argon2.hash as jest.Mock).mockResolvedValue('hashed-password');
    (argon2.verify as jest.Mock).mockResolvedValue(true);

    service = new UserService(users, refreshTokens, revocation, audit);
  });

  describe('create', () => {
    it('rejects a weak password', async () => {
      await expect(service.create(makeDto({ password: 'weak' }), tenantAdmin)).rejects.toThrow(
        BadRequestException,
      );
      expect(users.create).not.toHaveBeenCalled();
    });

    it('rejects a duplicate email', async () => {
      users.findByEmail.mockResolvedValue({} as User);

      await expect(service.create(makeDto(), tenantAdmin)).rejects.toThrow(ConflictException);
    });

    it('a tenant admin creates users within their own tenant', async () => {
      users.findByEmail.mockResolvedValue(null);
      users.create.mockResolvedValue({ id: 'new-user' } as User);

      await service.create(makeDto(), tenantAdmin);

      expect(users.create).toHaveBeenCalledWith(
        expect.objectContaining({ tenantId: 'tenant-1' }),
      );
    });

    it('a tenant admin cannot create a PLATFORM_ADMIN', async () => {
      users.findByEmail.mockResolvedValue(null);

      await expect(
        service.create(makeDto({ role: SystemRole.PLATFORM_ADMIN }), tenantAdmin),
      ).rejects.toThrow(BadRequestException);
    });

    it('a platform admin must supply tenantId for a non-admin user', async () => {
      users.findByEmail.mockResolvedValue(null);

      await expect(service.create(makeDto({ role: SystemRole.TENANT_ADMIN }), platformAdmin)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('a platform admin creates the first admin for a tenant they specify', async () => {
      users.findByEmail.mockResolvedValue(null);
      users.create.mockResolvedValue({ id: 'new-admin' } as User);

      await service.create(
        makeDto({ role: SystemRole.TENANT_ADMIN, tenantId: 'tenant-2' }),
        platformAdmin,
      );

      expect(users.create).toHaveBeenCalledWith(expect.objectContaining({ tenantId: 'tenant-2' }));
    });

    it('a platform admin creating another platform admin needs no tenantId', async () => {
      users.findByEmail.mockResolvedValue(null);
      users.create.mockResolvedValue({ id: 'new-platform-admin' } as User);

      await service.create(makeDto({ role: SystemRole.PLATFORM_ADMIN }), platformAdmin);

      expect(users.create).toHaveBeenCalledWith(expect.objectContaining({ tenantId: null }));
    });

    it('rejects ORG_ADMIN with no organizationId', async () => {
      users.findByEmail.mockResolvedValue(null);

      await expect(service.create(makeDto({ role: SystemRole.ORG_ADMIN }), tenantAdmin)).rejects.toThrow(
        BadRequestException,
      );
      expect(users.create).not.toHaveBeenCalled();
    });

    it('rejects a non-ORG_ADMIN role that supplies organizationId', async () => {
      users.findByEmail.mockResolvedValue(null);

      await expect(
        service.create(makeDto({ role: SystemRole.HR_MANAGER, organizationId: 'org-1' }), tenantAdmin),
      ).rejects.toThrow(BadRequestException);
      expect(users.create).not.toHaveBeenCalled();
    });

    it('rejects an ORG_ADMIN organizationId that does not belong to the tenant', async () => {
      users.findByEmail.mockResolvedValue(null);
      users.organizationExistsInTenant.mockResolvedValue(false);

      await expect(
        service.create(makeDto({ role: SystemRole.ORG_ADMIN, organizationId: 'org-9' }), tenantAdmin),
      ).rejects.toThrow(NotFoundException);
      expect(users.organizationExistsInTenant).toHaveBeenCalledWith('tenant-1', 'org-9');
      expect(users.create).not.toHaveBeenCalled();
    });

    it('creates an ORG_ADMIN scoped to a valid organization', async () => {
      users.findByEmail.mockResolvedValue(null);
      users.organizationExistsInTenant.mockResolvedValue(true);
      users.create.mockResolvedValue({ id: 'new-org-admin' } as User);

      await service.create(makeDto({ role: SystemRole.ORG_ADMIN, organizationId: 'org-1' }), tenantAdmin);

      expect(users.create).toHaveBeenCalledWith(
        expect.objectContaining({ tenantId: 'tenant-1', organizationId: 'org-1', role: SystemRole.ORG_ADMIN }),
      );
    });
  });

  describe('tenant-scoped reads', () => {
    it('throws when a platform admin (no tenant) tries to list users', () => {
      expect(() => service.list(platformAdmin)).toThrow(BadRequestException);
    });

    it('lists users within the actor tenant', async () => {
      users.listByTenant.mockResolvedValue([]);

      await service.list(tenantAdmin);

      expect(users.listByTenant).toHaveBeenCalledWith('tenant-1');
    });

    it('findById throws NotFoundException when the user does not exist in scope', async () => {
      users.findById.mockResolvedValue(null);

      await expect(service.findById(tenantAdmin, 'missing')).rejects.toThrow(NotFoundException);
    });
  });

  describe('updateRole', () => {
    it('rejects assigning PLATFORM_ADMIN within a tenant', async () => {
      users.findById.mockResolvedValue({ id: 'user-2' } as User);

      await expect(
        service.updateRole(tenantAdmin, 'user-2', SystemRole.PLATFORM_ADMIN),
      ).rejects.toThrow(BadRequestException);
    });

    it('updates a tenant-wide role with no organizationId', async () => {
      users.findById.mockResolvedValue({ id: 'user-2' } as User);
      users.updateRole.mockResolvedValue({ id: 'user-2', role: SystemRole.HR_MANAGER } as User);

      await service.updateRole(tenantAdmin, 'user-2', SystemRole.HR_MANAGER);

      expect(users.updateRole).toHaveBeenCalledWith('tenant-1', 'user-2', SystemRole.HR_MANAGER, null, 'actor-1');
    });

    it('rejects ORG_ADMIN with no organizationId', async () => {
      users.findById.mockResolvedValue({ id: 'user-2' } as User);

      await expect(service.updateRole(tenantAdmin, 'user-2', SystemRole.ORG_ADMIN)).rejects.toThrow(
        BadRequestException,
      );
      expect(users.updateRole).not.toHaveBeenCalled();
    });

    it('promotes a user to ORG_ADMIN scoped to a valid organization', async () => {
      users.findById.mockResolvedValue({ id: 'user-2' } as User);
      users.organizationExistsInTenant.mockResolvedValue(true);
      users.updateRole.mockResolvedValue({ id: 'user-2', role: SystemRole.ORG_ADMIN } as User);

      await service.updateRole(tenantAdmin, 'user-2', SystemRole.ORG_ADMIN, 'org-1');

      expect(users.organizationExistsInTenant).toHaveBeenCalledWith('tenant-1', 'org-1');
      expect(users.updateRole).toHaveBeenCalledWith(
        'tenant-1',
        'user-2',
        SystemRole.ORG_ADMIN,
        'org-1',
        'actor-1',
      );
    });
  });

  describe('updateProfile', () => {
    it('rejects a new email already in use by another user', async () => {
      users.findById.mockResolvedValue({ id: 'user-2' } as User);
      users.findByEmail.mockResolvedValue({ id: 'someone-else' } as User);

      await expect(
        service.updateProfile(tenantAdmin, 'user-2', { email: 'taken@acme.com' }),
      ).rejects.toThrow(ConflictException);
      expect(users.updateProfile).not.toHaveBeenCalled();
    });

    it('allows keeping the same email (no conflict with self)', async () => {
      users.findById.mockResolvedValue({ id: 'user-2' } as User);
      users.findByEmail.mockResolvedValue({ id: 'user-2' } as User);
      users.updateProfile.mockResolvedValue({ id: 'user-2' } as User);

      await service.updateProfile(tenantAdmin, 'user-2', { email: 'user-2@acme.com' });

      expect(users.updateProfile).toHaveBeenCalled();
    });

    it('updates the profile and records an audit entry', async () => {
      users.findById.mockResolvedValue({ id: 'user-2' } as User);
      users.updateProfile.mockResolvedValue({ id: 'user-2', firstName: 'Kwame' } as User);

      await service.updateProfile(tenantAdmin, 'user-2', { firstName: 'Kwame' });

      expect(users.updateProfile).toHaveBeenCalledWith(
        'tenant-1',
        'user-2',
        { firstName: 'Kwame' },
        'actor-1',
      );
      expect(audit.record).toHaveBeenCalledWith(
        expect.objectContaining({ action: 'user.profile_updated', resourceId: 'user-2' }),
      );
    });
  });

  describe('adminResetPassword', () => {
    it('rejects a weak new password', async () => {
      users.findById.mockResolvedValue({ id: 'user-2' } as User);

      await expect(service.adminResetPassword(tenantAdmin, 'user-2', 'weak')).rejects.toThrow(
        BadRequestException,
      );
      expect(users.updatePassword).not.toHaveBeenCalled();
    });

    it('does not require the current password (unlike self-service change)', async () => {
      users.findById.mockResolvedValue({ id: 'user-2' } as User);
      users.updatePassword.mockResolvedValue({ id: 'user-2' } as User);

      await expect(
        service.adminResetPassword(tenantAdmin, 'user-2', validPassword),
      ).resolves.toBeDefined();
      expect(argon2.verify).not.toHaveBeenCalled();
    });

    it('updates the password, revokes every session for the target user, and records an audit entry', async () => {
      users.findById.mockResolvedValue({ id: 'user-2' } as User);
      users.updatePassword.mockResolvedValue({ id: 'user-2' } as User);

      await service.adminResetPassword(tenantAdmin, 'user-2', validPassword);

      expect(users.updatePassword).toHaveBeenCalledWith('tenant-1', 'user-2', 'hashed-password');
      expect(refreshTokens.revokeAllForUser).toHaveBeenCalledWith('tenant-1', 'user-2');
      expect(revocation.revokeAllForUser).toHaveBeenCalledWith('user-2');
      expect(audit.record).toHaveBeenCalledWith(
        expect.objectContaining({ action: 'user.password_reset_by_admin', resourceId: 'user-2' }),
      );
    });
  });

  describe('changePassword', () => {
    const dto = { currentPassword: 'OldPassword9', newPassword: validPassword };

    it('rejects when the current password is wrong', async () => {
      users.findById.mockResolvedValue({ id: 'actor-1', passwordHash: 'hash' } as User);
      (argon2.verify as jest.Mock).mockResolvedValue(false);

      await expect(service.changePassword(tenantAdmin, dto)).rejects.toThrow(UnauthorizedException);
      expect(users.updatePassword).not.toHaveBeenCalled();
    });

    it('rejects a new password that fails the strength requirements', async () => {
      users.findById.mockResolvedValue({ id: 'actor-1', passwordHash: 'hash' } as User);

      await expect(
        service.changePassword(tenantAdmin, { ...dto, newPassword: 'weak' }),
      ).rejects.toThrow(BadRequestException);
      expect(users.updatePassword).not.toHaveBeenCalled();
    });

    it('updates the password, revokes every session, and records an audit entry', async () => {
      users.findById.mockResolvedValue({ id: 'actor-1', passwordHash: 'hash' } as User);
      users.updatePassword.mockResolvedValue({ id: 'actor-1' } as User);

      await service.changePassword(tenantAdmin, dto);

      expect(users.updatePassword).toHaveBeenCalledWith('tenant-1', 'actor-1', 'hashed-password');
      expect(refreshTokens.revokeAllForUser).toHaveBeenCalledWith('tenant-1', 'actor-1');
      expect(revocation.revokeAllForUser).toHaveBeenCalledWith('actor-1');
      expect(audit.record).toHaveBeenCalledWith(
        expect.objectContaining({ action: 'user.password_changed', resourceId: 'actor-1' }),
      );
    });

    it('works for a platform admin (no tenant)', async () => {
      users.findById.mockResolvedValue({ id: 'actor-2', passwordHash: 'hash' } as User);
      users.updatePassword.mockResolvedValue({ id: 'actor-2' } as User);

      await service.changePassword(platformAdmin, dto);

      expect(users.updatePassword).toHaveBeenCalledWith(null, 'actor-2', 'hashed-password');
    });

    it('throws when the account no longer exists', async () => {
      users.findById.mockResolvedValue(null);

      await expect(service.changePassword(tenantAdmin, dto)).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('listForTenant', () => {
    it('lists users for an arbitrary tenant (no actor.tenantId needed)', async () => {
      users.listByTenant.mockResolvedValue([]);

      await service.listForTenant('tenant-9');

      expect(users.listByTenant).toHaveBeenCalledWith('tenant-9');
    });
  });

  describe('updateRoleForTenant', () => {
    it('throws NotFoundException when the user does not exist in that tenant', async () => {
      users.findById.mockResolvedValue(null);

      await expect(
        service.updateRoleForTenant('tenant-9', 'missing', SystemRole.HR_MANAGER),
      ).rejects.toThrow(NotFoundException);
      expect(users.updateRole).not.toHaveBeenCalled();
    });

    it('rejects assigning PLATFORM_ADMIN within a tenant', async () => {
      users.findById.mockResolvedValue({ id: 'user-2' } as User);

      await expect(
        service.updateRoleForTenant('tenant-9', 'user-2', SystemRole.PLATFORM_ADMIN),
      ).rejects.toThrow(BadRequestException);
      expect(users.updateRole).not.toHaveBeenCalled();
    });

    it('updates the role and records an audit entry', async () => {
      users.findById.mockResolvedValue({ id: 'user-2' } as User);
      users.updateRole.mockResolvedValue({ id: 'user-2', role: SystemRole.HR_MANAGER } as User);

      await service.updateRoleForTenant('tenant-9', 'user-2', SystemRole.HR_MANAGER, 'actor-2');

      expect(users.updateRole).toHaveBeenCalledWith(
        'tenant-9',
        'user-2',
        SystemRole.HR_MANAGER,
        null,
        'actor-2',
      );
      expect(audit.record).toHaveBeenCalledWith(
        expect.objectContaining({ action: 'user.role_changed', tenantId: 'tenant-9', resourceId: 'user-2' }),
      );
    });
  });

  describe('updateProfileForTenant', () => {
    it('throws NotFoundException when the user does not exist in that tenant', async () => {
      users.findById.mockResolvedValue(null);

      await expect(
        service.updateProfileForTenant('tenant-9', 'missing', { firstName: 'Kwame' }),
      ).rejects.toThrow(NotFoundException);
      expect(users.updateProfile).not.toHaveBeenCalled();
    });

    it('updates the profile and records an audit entry', async () => {
      users.findById.mockResolvedValue({ id: 'user-2' } as User);
      users.updateProfile.mockResolvedValue({ id: 'user-2', firstName: 'Kwame' } as User);

      await service.updateProfileForTenant('tenant-9', 'user-2', { firstName: 'Kwame' }, 'actor-2');

      expect(users.updateProfile).toHaveBeenCalledWith(
        'tenant-9',
        'user-2',
        { firstName: 'Kwame' },
        'actor-2',
      );
      expect(audit.record).toHaveBeenCalledWith(
        expect.objectContaining({ action: 'user.profile_updated', tenantId: 'tenant-9', resourceId: 'user-2' }),
      );
    });
  });

  describe('adminResetPasswordForTenant', () => {
    it('throws NotFoundException when the user does not exist in that tenant', async () => {
      users.findById.mockResolvedValue(null);

      await expect(
        service.adminResetPasswordForTenant('tenant-9', 'missing', validPassword),
      ).rejects.toThrow(NotFoundException);
      expect(users.updatePassword).not.toHaveBeenCalled();
    });

    it('updates the password, revokes every session, and records an audit entry', async () => {
      users.findById.mockResolvedValue({ id: 'user-2' } as User);
      users.updatePassword.mockResolvedValue({ id: 'user-2' } as User);

      await service.adminResetPasswordForTenant('tenant-9', 'user-2', validPassword, 'actor-2');

      expect(users.updatePassword).toHaveBeenCalledWith('tenant-9', 'user-2', 'hashed-password');
      expect(refreshTokens.revokeAllForUser).toHaveBeenCalledWith('tenant-9', 'user-2');
      expect(revocation.revokeAllForUser).toHaveBeenCalledWith('user-2');
      expect(audit.record).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'user.password_reset_by_admin',
          tenantId: 'tenant-9',
          resourceId: 'user-2',
        }),
      );
    });
  });

  describe('setActiveForTenant', () => {
    it('throws NotFoundException when the user does not exist in that tenant', async () => {
      users.findById.mockResolvedValue(null);

      await expect(service.setActiveForTenant('tenant-9', 'missing', false)).rejects.toThrow(
        NotFoundException,
      );
      expect(users.setActive).not.toHaveBeenCalled();
    });

    it('deactivates the user and records an audit entry', async () => {
      users.findById.mockResolvedValue({ id: 'user-2' } as User);
      users.setActive.mockResolvedValue({ id: 'user-2', isActive: false } as User);

      await service.setActiveForTenant('tenant-9', 'user-2', false, 'actor-2');

      expect(users.setActive).toHaveBeenCalledWith('tenant-9', 'user-2', false, 'actor-2');
      expect(audit.record).toHaveBeenCalledWith(
        expect.objectContaining({ action: 'user.deactivated', tenantId: 'tenant-9', resourceId: 'user-2' }),
      );
    });
  });
});
