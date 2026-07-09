import { BadRequestException, ConflictException, NotFoundException } from '@nestjs/common';
import * as argon2 from 'argon2';
import { User } from '@prisma/client';
import { RequestUser, SystemRole } from '@africahr/platform-auth';
import { AuditService } from '@africahr/platform-audit';
import { UserRepository } from '@africahr/iam-data-access';
import { UserService } from './user.service';
import { CreateUserDto } from './dto/create-user.dto';

jest.mock('argon2');

describe('UserService', () => {
  let service: UserService;
  let users: jest.Mocked<UserRepository>;
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
    } as unknown as jest.Mocked<UserRepository>;

    audit = { record: jest.fn().mockResolvedValue(undefined) } as unknown as jest.Mocked<AuditService>;

    (argon2.hash as jest.Mock).mockResolvedValue('hashed-password');

    service = new UserService(users, audit);
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
});
