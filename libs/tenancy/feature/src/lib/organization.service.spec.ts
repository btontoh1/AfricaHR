import { NotFoundException } from '@nestjs/common';
import { Organization, Tenant } from '@prisma/client';
import { AuditService } from '@africahr/platform-audit';
import { OrganizationRepository, TenantRepository } from '@africahr/tenancy-data-access';
import { TenantStatus } from '@africahr/tenancy-domain';
import { OrganizationService } from './organization.service';

describe('OrganizationService', () => {
  let service: OrganizationService;
  let organizations: jest.Mocked<OrganizationRepository>;
  let tenants: jest.Mocked<TenantRepository>;
  let audit: jest.Mocked<AuditService>;

  const tenant: Tenant = {
    id: 'tenant-1',
    name: 'Acme Ghana Ltd',
    slug: 'acme-ghana-ltd',
    status: TenantStatus.ACTIVE,
    country: 'GH',
    currency: 'GHS',
    timezone: 'Africa/Accra',
    createdAt: new Date(),
    updatedAt: new Date(),
    deletedAt: null,
    createdBy: null,
    updatedBy: null,
  };

  const organization: Organization = {
    id: 'org-1',
    tenantId: 'tenant-1',
    legalName: 'Acme Ghana Ltd',
    tradingName: null,
    countryCode: 'GH',
    registrationNumber: 'BN-12345',
    taxIdentificationNumber: null,
    metadata: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    deletedAt: null,
    createdBy: null,
    updatedBy: null,
  };

  beforeEach(() => {
    organizations = {
      create: jest.fn(),
      findById: jest.fn(),
      listByTenant: jest.fn(),
      softDelete: jest.fn(),
    } as unknown as jest.Mocked<OrganizationRepository>;

    tenants = {
      findById: jest.fn(),
    } as unknown as jest.Mocked<TenantRepository>;

    audit = { record: jest.fn().mockResolvedValue(undefined) } as unknown as jest.Mocked<AuditService>;

    service = new OrganizationService(organizations, tenants, audit);
  });

  describe('create', () => {
    it('throws NotFoundException when the tenant does not exist', async () => {
      tenants.findById.mockResolvedValue(null);

      await expect(
        service.create('tenant-1', {
          legalName: 'Acme Ghana Ltd',
          countryCode: 'GH',
          registrationNumber: 'BN-12345',
        }),
      ).rejects.toThrow(NotFoundException);

      expect(organizations.create).not.toHaveBeenCalled();
    });

    it('creates the organization when the tenant exists', async () => {
      tenants.findById.mockResolvedValue(tenant);
      organizations.create.mockResolvedValue(organization);

      const result = await service.create('tenant-1', {
        legalName: 'Acme Ghana Ltd',
        countryCode: 'GH',
        registrationNumber: 'BN-12345',
      });

      expect(result).toEqual(organization);
      expect(organizations.create).toHaveBeenCalledWith(
        'tenant-1',
        expect.objectContaining({ legalName: 'Acme Ghana Ltd' }),
      );
    });
  });

  describe('findById', () => {
    it('throws NotFoundException when the organization does not exist', async () => {
      organizations.findById.mockResolvedValue(null);

      await expect(service.findById('tenant-1', 'missing')).rejects.toThrow(NotFoundException);
    });
  });
});
