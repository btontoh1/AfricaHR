import { BadRequestException, ConflictException } from '@nestjs/common';
import * as argon2 from 'argon2';
import { Tenant, User } from '@prisma/client';
import { SystemRole } from '@africahr/platform-auth';
import { AuthResponseDto, AuthService } from '@africahr/iam-feature';
import { UserRepository } from '@africahr/iam-data-access';
import { TenantService } from '@africahr/tenancy-feature';
import { SetupService } from './setup.service';
import { SetupDto } from './dto/setup.dto';

jest.mock('argon2');

describe('SetupService', () => {
  let service: SetupService;
  let tenants: jest.Mocked<TenantService>;
  let users: jest.Mocked<UserRepository>;
  let auth: jest.Mocked<AuthService>;

  const tenant: Tenant = {
    id: 'tenant-1',
    name: 'Acme Ghana Ltd',
    slug: 'acme-ghana-ltd',
    country: 'GH',
    currency: 'GHS',
    timezone: 'Africa/Accra',
    status: 'ACTIVE',
    createdAt: new Date(),
    updatedAt: new Date(),
    deletedAt: null,
    createdBy: null,
    updatedBy: null,
  } as Tenant;

  const dto: SetupDto = {
    companyName: 'Acme Ghana Ltd',
    country: 'GH',
    currency: 'GHS',
    timezone: 'Africa/Accra',
    adminFirstName: 'Ama',
    adminLastName: 'Owusu',
    adminEmail: 'admin@acme-ghana.com',
    adminPassword: 'CorrectHorseBattery9',
  };

  beforeEach(() => {
    tenants = {
      create: jest.fn(),
      list: jest.fn(),
      softDelete: jest.fn(),
    } as unknown as jest.Mocked<TenantService>;

    users = {
      create: jest.fn(),
    } as unknown as jest.Mocked<UserRepository>;

    auth = {
      login: jest.fn(),
    } as unknown as jest.Mocked<AuthService>;

    service = new SetupService(tenants, users, auth);
    (argon2.hash as jest.Mock).mockResolvedValue('hashed-password');
  });

  describe('needsSetup', () => {
    it('is true when no tenant exists', async () => {
      tenants.list.mockResolvedValue([]);

      await expect(service.needsSetup()).resolves.toBe(true);
    });

    it('is false once a tenant exists', async () => {
      tenants.list.mockResolvedValue([tenant]);

      await expect(service.needsSetup()).resolves.toBe(false);
    });
  });

  describe('bootstrap', () => {
    it('refuses when setup has already been completed', async () => {
      tenants.list.mockResolvedValue([tenant]);

      await expect(service.bootstrap(dto)).rejects.toThrow(ConflictException);
      expect(tenants.create).not.toHaveBeenCalled();
    });

    it('rejects a weak admin password without creating anything', async () => {
      tenants.list.mockResolvedValue([]);

      await expect(service.bootstrap({ ...dto, adminPassword: 'weak' })).rejects.toThrow(
        BadRequestException,
      );
      expect(tenants.create).not.toHaveBeenCalled();
    });

    it('creates the tenant and admin, then logs in', async () => {
      tenants.list.mockResolvedValue([]);
      tenants.create.mockResolvedValue(tenant);
      users.create.mockResolvedValue({ id: 'user-1' } as User);
      auth.login.mockResolvedValue({ accessToken: 'a', refreshToken: 'r' } as AuthResponseDto);

      const result = await service.bootstrap(dto, { ipAddress: '127.0.0.1' });

      expect(tenants.create).toHaveBeenCalledWith({
        name: dto.companyName,
        country: dto.country,
        currency: dto.currency,
        timezone: dto.timezone,
      });
      expect(users.create).toHaveBeenCalledWith(
        expect.objectContaining({
          tenantId: tenant.id,
          email: dto.adminEmail,
          passwordHash: 'hashed-password',
          role: SystemRole.TENANT_ADMIN,
        }),
      );
      expect(auth.login).toHaveBeenCalledWith(
        { email: dto.adminEmail, password: dto.adminPassword },
        { ipAddress: '127.0.0.1' },
      );
      expect(result).toEqual({ accessToken: 'a', refreshToken: 'r' });
      expect(tenants.softDelete).not.toHaveBeenCalled();
    });

    it('rolls back the tenant if admin account creation fails', async () => {
      tenants.list.mockResolvedValue([]);
      tenants.create.mockResolvedValue(tenant);
      users.create.mockRejectedValue(new Error('db exploded'));

      await expect(service.bootstrap(dto)).rejects.toThrow('db exploded');
      expect(tenants.softDelete).toHaveBeenCalledWith(tenant.id);
      expect(auth.login).not.toHaveBeenCalled();
    });
  });
});
