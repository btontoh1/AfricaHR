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
    iat: 1,
    exp: 2,
  };

  const platformAdmin: RequestUser = {
    sub: 'actor-2',
    email: 'ops@africahr.com',
    role: SystemRole.PLATFORM_ADMIN,
    tenantId: null,
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
      setActive: jest.fn(),
      softDelete: jest.fn(),
      updatePassword: jest.fn(),
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

      expect(users.updateRole).toHaveBeenCalledWith('tenant-9', 'user-2', SystemRole.HR_MANAGER, 'actor-2');
      expect(audit.record).toHaveBeenCalledWith(
        expect.objectContaining({ action: 'user.role_changed', tenantId: 'tenant-9', resourceId: 'user-2' }),
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
