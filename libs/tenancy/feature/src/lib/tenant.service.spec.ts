import { ConflictException, NotFoundException } from '@nestjs/common';
import { Tenant } from '@prisma/client';
import { AuditService } from '@africahr/platform-audit';
import { StorageService } from '@africahr/platform-storage';
import { TenantRepository } from '@africahr/tenancy-data-access';
import { TenantStatus } from '@africahr/tenancy-domain';
import { TenantService } from './tenant.service';

describe('TenantService', () => {
  let service: TenantService;
  let repo: jest.Mocked<TenantRepository>;
  let audit: jest.Mocked<AuditService>;
  let storage: jest.Mocked<StorageService>;

  const baseTenant: Tenant = {
    id: 'tenant-1',
    name: 'Acme Ghana Ltd',
    slug: 'acme-ghana-ltd',
    status: TenantStatus.TRIAL,
    country: 'GH',
    currency: 'GHS',
    timezone: 'Africa/Accra',
    logoStorageKey: null,
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
      updateLogo: jest.fn(),
    } as unknown as jest.Mocked<TenantRepository>;

    audit = { record: jest.fn().mockResolvedValue(undefined) } as unknown as jest.Mocked<AuditService>;

    storage = {
      getUploadUrl: jest.fn(),
      getViewUrl: jest.fn(),
      deleteObject: jest.fn(),
    } as unknown as jest.Mocked<StorageService>;

    service = new TenantService(repo, audit, storage);
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
      expect(audit.record).toHaveBeenCalledWith(
        expect.objectContaining({ action: 'tenant.created', tenantId: baseTenant.id }),
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

  describe('findBySlugForLogin', () => {
    it('throws NotFoundException when no tenant has that slug', async () => {
      repo.findBySlug.mockResolvedValue(null);

      await expect(service.findBySlugForLogin('missing')).rejects.toThrow(NotFoundException);
    });

    it.each([TenantStatus.TRIAL, TenantStatus.ACTIVE])(
      'returns the tenant when status is %s',
      async (status) => {
        repo.findBySlug.mockResolvedValue({ ...baseTenant, status });

        await expect(service.findBySlugForLogin('acme-ghana-ltd')).resolves.toEqual({
          ...baseTenant,
          status,
        });
      },
    );

    it.each([TenantStatus.SUSPENDED, TenantStatus.CLOSED])(
      'throws NotFoundException when status is %s',
      async (status) => {
        repo.findBySlug.mockResolvedValue({ ...baseTenant, status });

        await expect(service.findBySlugForLogin('acme-ghana-ltd')).rejects.toThrow(
          NotFoundException,
        );
      },
    );
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

  describe('requestLogoUpload', () => {
    it('mints a namespaced storage key, requests a signed upload URL, and saves it on the tenant', async () => {
      repo.findById.mockResolvedValue(baseTenant);
      storage.getUploadUrl.mockResolvedValue('https://storage.example/upload?sig=abc');
      repo.updateLogo.mockResolvedValue({ ...baseTenant, logoStorageKey: 'tenant-logos/tenant-1/uuid-logo.png' });

      const result = await service.requestLogoUpload(
        'tenant-1',
        { fileName: 'logo.png', contentType: 'image/png' },
        'user-1',
      );

      expect(result).toEqual({ uploadUrl: 'https://storage.example/upload?sig=abc' });
      expect(storage.getUploadUrl).toHaveBeenCalledWith(
        expect.stringMatching(/^tenant-logos\/tenant-1\/.+-logo\.png$/),
        'image/png',
      );
      expect(repo.updateLogo).toHaveBeenCalledWith(
        'tenant-1',
        expect.stringMatching(/^tenant-logos\/tenant-1\/.+-logo\.png$/),
        'user-1',
      );
      expect(audit.record).toHaveBeenCalledWith(
        expect.objectContaining({ action: 'tenant.logo_updated', tenantId: 'tenant-1' }),
      );
    });

    it('throws NotFoundException when the tenant does not exist', async () => {
      repo.findById.mockResolvedValue(null);

      await expect(
        service.requestLogoUpload('missing', { fileName: 'logo.png', contentType: 'image/png' }),
      ).rejects.toThrow(NotFoundException);
      expect(storage.getUploadUrl).not.toHaveBeenCalled();
    });
  });

  describe('removeLogo', () => {
    it('deletes the stored object and clears the logo key', async () => {
      repo.findById.mockResolvedValue({ ...baseTenant, logoStorageKey: 'tenant-logos/tenant-1/uuid-logo.png' });

      await service.removeLogo('tenant-1', 'user-1');

      expect(storage.deleteObject).toHaveBeenCalledWith('tenant-logos/tenant-1/uuid-logo.png');
      expect(repo.updateLogo).toHaveBeenCalledWith('tenant-1', null, 'user-1');
      expect(audit.record).toHaveBeenCalledWith(
        expect.objectContaining({ action: 'tenant.logo_removed', tenantId: 'tenant-1' }),
      );
    });

    it('is a no-op when the tenant has no logo', async () => {
      repo.findById.mockResolvedValue(baseTenant);

      await service.removeLogo('tenant-1', 'user-1');

      expect(storage.deleteObject).not.toHaveBeenCalled();
      expect(repo.updateLogo).not.toHaveBeenCalled();
      expect(audit.record).not.toHaveBeenCalled();
    });
  });

  describe('getLogoUrl', () => {
    it('returns null when the tenant has no logo', async () => {
      await expect(service.getLogoUrl(baseTenant)).resolves.toBeNull();
      expect(storage.getViewUrl).not.toHaveBeenCalled();
    });

    it('resolves a signed view URL when a logo is set', async () => {
      storage.getViewUrl.mockResolvedValue('https://storage.example/view?sig=xyz');

      await expect(
        service.getLogoUrl({ ...baseTenant, logoStorageKey: 'tenant-logos/tenant-1/uuid-logo.png' }),
      ).resolves.toBe('https://storage.example/view?sig=xyz');
      expect(storage.getViewUrl).toHaveBeenCalledWith('tenant-logos/tenant-1/uuid-logo.png', 60 * 60);
    });
  });
});
