import { ConflictException, NotFoundException } from '@nestjs/common';
import { Organization, Tenant } from '@prisma/client';
import { AuditService } from '@africahr/platform-audit';
import { OrganizationRepository, TenantRepository } from '@africahr/tenancy-data-access';
import { OrganizationVerificationStatus, TenantStatus } from '@africahr/tenancy-domain';
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
    logoStorageKey: null,
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
    verificationStatus: OrganizationVerificationStatus.UNVERIFIED,
    verificationNote: null,
    verifiedAt: null,
    verifiedBy: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    deletedAt: null,
    createdBy: 'creator-1',
    updatedBy: null,
  };

  beforeEach(() => {
    organizations = {
      create: jest.fn(),
      findById: jest.fn(),
      listByTenant: jest.fn(),
      softDelete: jest.fn(),
      submitForVerification: jest.fn(),
      verify: jest.fn(),
      reject: jest.fn(),
      listPendingReview: jest.fn(),
      findByIdAcrossTenants: jest.fn(),
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

  describe('submitForVerification', () => {
    it('submits an UNVERIFIED organization for review', async () => {
      organizations.findById.mockResolvedValue(organization);
      const pending = { ...organization, verificationStatus: OrganizationVerificationStatus.PENDING_REVIEW };
      organizations.submitForVerification.mockResolvedValue(pending);

      const result = await service.submitForVerification('tenant-1', 'org-1', 'user-1');

      expect(result).toEqual(pending);
      expect(organizations.submitForVerification).toHaveBeenCalledWith('tenant-1', 'org-1', 'user-1');
      expect(audit.record).toHaveBeenCalledWith(
        expect.objectContaining({ action: 'organization.verification_submitted' }),
      );
    });

    it('rejects submitting an already-VERIFIED organization', async () => {
      organizations.findById.mockResolvedValue({
        ...organization,
        verificationStatus: OrganizationVerificationStatus.VERIFIED,
      });

      await expect(service.submitForVerification('tenant-1', 'org-1', 'user-1')).rejects.toThrow(
        ConflictException,
      );
      expect(organizations.submitForVerification).not.toHaveBeenCalled();
    });
  });

  describe('listPendingVerification', () => {
    it('delegates to the cross-tenant repository method', async () => {
      const pending = [{ ...organization, verificationStatus: OrganizationVerificationStatus.PENDING_REVIEW }];
      organizations.listPendingReview.mockResolvedValue(pending);

      await expect(service.listPendingVerification()).resolves.toEqual(pending);
    });
  });

  describe('verify', () => {
    it('verifies a PENDING_REVIEW organization', async () => {
      const pending = { ...organization, verificationStatus: OrganizationVerificationStatus.PENDING_REVIEW };
      organizations.findByIdAcrossTenants.mockResolvedValue(pending);
      const verified = { ...pending, verificationStatus: OrganizationVerificationStatus.VERIFIED };
      organizations.verify.mockResolvedValue(verified);

      const result = await service.verify('org-1', 'reviewer-1');

      expect(result).toEqual(verified);
      expect(organizations.verify).toHaveBeenCalledWith('tenant-1', 'org-1', 'reviewer-1');
      expect(audit.record).toHaveBeenCalledWith(expect.objectContaining({ action: 'organization.verified' }));
    });

    it('rejects verifying an UNVERIFIED organization (must be submitted first)', async () => {
      organizations.findByIdAcrossTenants.mockResolvedValue(organization);

      await expect(service.verify('org-1', 'reviewer-1')).rejects.toThrow(ConflictException);
      expect(organizations.verify).not.toHaveBeenCalled();
    });

    it('throws NotFoundException when the organization does not exist in any tenant', async () => {
      organizations.findByIdAcrossTenants.mockResolvedValue(null);

      await expect(service.verify('missing', 'reviewer-1')).rejects.toThrow(NotFoundException);
    });
  });

  describe('reject', () => {
    it('rejects a PENDING_REVIEW organization with a note', async () => {
      const pending = { ...organization, verificationStatus: OrganizationVerificationStatus.PENDING_REVIEW };
      organizations.findByIdAcrossTenants.mockResolvedValue(pending);
      const rejected = {
        ...pending,
        verificationStatus: OrganizationVerificationStatus.REJECTED,
        verificationNote: 'Registration number mismatch',
      };
      organizations.reject.mockResolvedValue(rejected);

      const result = await service.reject('org-1', 'Registration number mismatch', 'reviewer-1');

      expect(result).toEqual(rejected);
      expect(organizations.reject).toHaveBeenCalledWith(
        'tenant-1',
        'org-1',
        'Registration number mismatch',
        'reviewer-1',
      );
      expect(audit.record).toHaveBeenCalledWith(
        expect.objectContaining({ action: 'organization.verification_rejected' }),
      );
    });

    it('allows resubmission after rejection to move back to PENDING_REVIEW', async () => {
      const rejected = { ...organization, verificationStatus: OrganizationVerificationStatus.REJECTED };
      organizations.findById.mockResolvedValue(rejected);
      const pending = { ...rejected, verificationStatus: OrganizationVerificationStatus.PENDING_REVIEW };
      organizations.submitForVerification.mockResolvedValue(pending);

      await expect(service.submitForVerification('tenant-1', 'org-1', 'user-1')).resolves.toEqual(pending);
    });

    it('rejects rejecting a VERIFIED organization (terminal state)', async () => {
      organizations.findByIdAcrossTenants.mockResolvedValue({
        ...organization,
        verificationStatus: OrganizationVerificationStatus.VERIFIED,
      });

      await expect(service.reject('org-1', 'some note', 'reviewer-1')).rejects.toThrow(ConflictException);
      expect(organizations.reject).not.toHaveBeenCalled();
    });
  });
});
