import { ConflictException, NotFoundException } from '@nestjs/common';
import { Tenant } from '@prisma/client';
import { TenantRepository } from '@africahr/tenancy-data-access';
import { TenantStatus } from '@africahr/tenancy-domain';
import { TenantService } from './tenant.service';

describe('TenantService', () => {
  let service: TenantService;
  let repo: jest.Mocked<TenantRepository>;

  const baseTenant: Tenant = {
    id: 'tenant-1',
    name: 'Acme Ghana Ltd',
    slug: 'acme-ghana-ltd',
    status: TenantStatus.TRIAL,
    country: 'GH',
    currency: 'GHS',
    timezone: 'Africa/Accra',
    createdAt: new Date(),
    updatedAt: new Date(),
    deletedAt: null,
    createdBy: null,
    updatedBy: null,
  };

  beforeEach(() => {
    repo = {
      create: jest.fn(),
      findById: jest.fn(),
      findBySlug: jest.fn(),
      list: jest.fn(),
      updateStatus: jest.fn(),
      softDelete: jest.fn(),
    } as unknown as jest.Mocked<TenantRepository>;

    service = new TenantService(repo);
  });

  describe('create', () => {
    it('generates a slug from the name when none is provided', async () => {
      repo.findBySlug.mockResolvedValue(null);
      repo.create.mockResolvedValue(baseTenant);

      await service.create({
        name: 'Acme Ghana Ltd',
        country: 'GH',
        currency: 'GHS',
        timezone: 'Africa/Accra',
      });

      expect(repo.findBySlug).toHaveBeenCalledWith('acme-ghana-ltd');
      expect(repo.create).toHaveBeenCalledWith(
        expect.objectContaining({ slug: 'acme-ghana-ltd' }),
      );
    });

    it('rejects a slug that is already in use', async () => {
      repo.findBySlug.mockResolvedValue(baseTenant);

      await expect(
        service.create({
          name: 'Acme Ghana Ltd',
          slug: 'acme-ghana-ltd',
          country: 'GH',
          currency: 'GHS',
          timezone: 'Africa/Accra',
        }),
      ).rejects.toThrow(ConflictException);

      expect(repo.create).not.toHaveBeenCalled();
    });
  });

  describe('findById', () => {
    it('throws NotFoundException when the tenant does not exist', async () => {
      repo.findById.mockResolvedValue(null);

      await expect(service.findById('missing')).rejects.toThrow(NotFoundException);
    });

    it('returns the tenant when found', async () => {
      repo.findById.mockResolvedValue(baseTenant);

      await expect(service.findById('tenant-1')).resolves.toEqual(baseTenant);
    });
  });

  describe('updateStatus', () => {
    it('allows a legal transition', async () => {
      repo.findById.mockResolvedValue(baseTenant);
      repo.updateStatus.mockResolvedValue({ ...baseTenant, status: TenantStatus.ACTIVE });

      await service.updateStatus('tenant-1', TenantStatus.ACTIVE, 'ops-user-1');

      expect(repo.updateStatus).toHaveBeenCalledWith('tenant-1', TenantStatus.ACTIVE, 'ops-user-1');
    });

    it('rejects an illegal transition', async () => {
      repo.findById.mockResolvedValue({ ...baseTenant, status: TenantStatus.CLOSED });

      await expect(service.updateStatus('tenant-1', TenantStatus.ACTIVE)).rejects.toThrow(
        ConflictException,
      );
      expect(repo.updateStatus).not.toHaveBeenCalled();
    });
  });

  describe('softDelete', () => {
    it('throws NotFoundException if the tenant does not exist', async () => {
      repo.findById.mockResolvedValue(null);

      await expect(service.softDelete('missing')).rejects.toThrow(NotFoundException);
      expect(repo.softDelete).not.toHaveBeenCalled();
    });
  });
});
