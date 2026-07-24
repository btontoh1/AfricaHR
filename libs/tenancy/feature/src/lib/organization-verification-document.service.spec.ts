import { NotFoundException } from '@nestjs/common';
import { Organization, OrganizationVerificationDocument } from '@prisma/client';
import { AuditService } from '@africahr/platform-audit';
import { StorageService } from '@africahr/platform-storage';
import { OrganizationVerificationDocumentRepository } from '@africahr/tenancy-data-access';
import { OrganizationVerificationDocumentService } from './organization-verification-document.service';
import { OrganizationService } from './organization.service';

describe('OrganizationVerificationDocumentService', () => {
  let service: OrganizationVerificationDocumentService;
  let documents: jest.Mocked<OrganizationVerificationDocumentRepository>;
  let organizations: jest.Mocked<OrganizationService>;
  let storage: jest.Mocked<StorageService>;
  let audit: jest.Mocked<AuditService>;

  const document: OrganizationVerificationDocument = {
    id: 'doc-1',
    tenantId: 'tenant-1',
    organizationId: 'org-1',
    documentType: 'CERTIFICATE_OF_INCORPORATION',
    storageKey: 'verification-docs/tenant-1/org-1/uuid-cert.pdf',
    fileName: 'cert.pdf',
    contentType: 'application/pdf',
    createdAt: new Date(),
    deletedAt: null,
    createdBy: 'user-1',
  };

  beforeEach(() => {
    documents = {
      create: jest.fn(),
      findById: jest.fn(),
      listByOrganization: jest.fn(),
      softDelete: jest.fn(),
      findByIdAcrossTenants: jest.fn(),
      listByOrganizationAcrossTenants: jest.fn(),
    } as unknown as jest.Mocked<OrganizationVerificationDocumentRepository>;

    organizations = {
      findById: jest.fn(),
    } as unknown as jest.Mocked<OrganizationService>;

    storage = {
      getUploadUrl: jest.fn(),
      getViewUrl: jest.fn(),
      deleteObject: jest.fn(),
    } as unknown as jest.Mocked<StorageService>;

    audit = { record: jest.fn().mockResolvedValue(undefined) } as unknown as jest.Mocked<AuditService>;

    service = new OrganizationVerificationDocumentService(documents, organizations, storage, audit);
  });

  describe('requestUpload', () => {
    it('mints a namespaced storage key, requests a signed upload URL, and records the document', async () => {
      organizations.findById.mockResolvedValue({ id: 'org-1' } as Organization);
      storage.getUploadUrl.mockResolvedValue('https://storage.example/upload?sig=abc');
      documents.create.mockResolvedValue(document);

      const result = await service.requestUpload(
        'tenant-1',
        'org-1',
        { documentType: 'CERTIFICATE_OF_INCORPORATION', fileName: 'cert.pdf', contentType: 'application/pdf' },
        'user-1',
      );

      expect(result).toEqual({ uploadUrl: 'https://storage.example/upload?sig=abc', documentId: 'doc-1' });
      expect(storage.getUploadUrl).toHaveBeenCalledWith(
        expect.stringMatching(/^verification-docs\/tenant-1\/org-1\/.+-cert\.pdf$/),
        'application/pdf',
      );
      expect(documents.create).toHaveBeenCalledWith('tenant-1', expect.objectContaining({ organizationId: 'org-1' }));
      expect(audit.record).toHaveBeenCalledWith(
        expect.objectContaining({ action: 'organization.verification_document_added' }),
      );
    });

    it('throws NotFoundException when the organization does not exist in this tenant', async () => {
      organizations.findById.mockRejectedValue(new NotFoundException('Organization "missing-org" not found'));

      await expect(
        service.requestUpload(
          'tenant-1',
          'missing-org',
          { documentType: 'OTHER', fileName: 'x.pdf', contentType: 'application/pdf' },
          'user-1',
        ),
      ).rejects.toThrow(NotFoundException);
      expect(storage.getUploadUrl).not.toHaveBeenCalled();
    });
  });

  describe('getViewUrl', () => {
    it('resolves a signed view URL for a document within the tenant', async () => {
      documents.findById.mockResolvedValue(document);
      storage.getViewUrl.mockResolvedValue('https://storage.example/view?sig=xyz');

      await expect(service.getViewUrl('tenant-1', 'doc-1')).resolves.toBe('https://storage.example/view?sig=xyz');
      expect(storage.getViewUrl).toHaveBeenCalledWith(document.storageKey);
    });

    it('throws NotFoundException when the document does not exist', async () => {
      documents.findById.mockResolvedValue(null);

      await expect(service.getViewUrl('tenant-1', 'missing')).rejects.toThrow(NotFoundException);
    });
  });

  describe('getViewUrlAcrossTenants', () => {
    it('resolves a signed view URL without a tenant filter', async () => {
      documents.findByIdAcrossTenants.mockResolvedValue(document);
      storage.getViewUrl.mockResolvedValue('https://storage.example/view?sig=xyz');

      await expect(service.getViewUrlAcrossTenants('doc-1')).resolves.toBe('https://storage.example/view?sig=xyz');
      expect(documents.findByIdAcrossTenants).toHaveBeenCalledWith('doc-1');
    });
  });

  describe('listByOrganizationAcrossTenants', () => {
    it('delegates to the cross-tenant repository method', async () => {
      documents.listByOrganizationAcrossTenants.mockResolvedValue([document]);

      await expect(service.listByOrganizationAcrossTenants('org-1')).resolves.toEqual([document]);
      expect(documents.listByOrganizationAcrossTenants).toHaveBeenCalledWith('org-1');
    });
  });
});
