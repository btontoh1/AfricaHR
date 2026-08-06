import { ForbiddenException } from '@nestjs/common';
import { RequestUser, SystemRole } from '@africahr/platform-auth';
import { OrganizationController } from './organization.controller';
import { OrganizationService } from './organization.service';
import { OrganizationVerificationDocumentService } from './organization-verification-document.service';

describe('OrganizationController', () => {
  let controller: OrganizationController;
  let organizations: jest.Mocked<OrganizationService>;
  let verificationDocuments: jest.Mocked<OrganizationVerificationDocumentService>;

  const tenantAdmin: RequestUser = {
    sub: 'admin-1',
    email: 'admin@acme.com',
    role: SystemRole.TENANT_ADMIN,
    tenantId: 'tenant-1',
    iat: 1,
    exp: 2,
  };

  beforeEach(() => {
    organizations = {
      create: jest.fn(),
      listByTenant: jest.fn(),
      findById: jest.fn(),
      update: jest.fn(),
      submitForVerification: jest.fn(),
    } as unknown as jest.Mocked<OrganizationService>;

    verificationDocuments = {
      requestUpload: jest.fn(),
      listByOrganization: jest.fn(),
      getViewUrl: jest.fn(),
    } as unknown as jest.Mocked<OrganizationVerificationDocumentService>;

    controller = new OrganizationController(organizations, verificationDocuments);
  });

  it('creates within the route tenant when the actor matches', () => {
    const dto = { legalName: 'Acme', countryCode: 'GH', registrationNumber: 'BN-1' };

    controller.create('tenant-1', dto, tenantAdmin);

    expect(organizations.create).toHaveBeenCalledWith('tenant-1', dto, 'admin-1');
  });

  it('rejects a tenant admin acting on a different tenant', () => {
    const dto = { legalName: 'Acme', countryCode: 'GH', registrationNumber: 'BN-1' };

    expect(() => controller.create('tenant-2', dto, tenantAdmin)).toThrow(ForbiddenException);
    expect(organizations.create).not.toHaveBeenCalled();
  });

  it('updates within the route tenant when the actor matches', () => {
    const dto = { legalName: 'Acme Kenya Ltd' };

    controller.update('tenant-1', 'org-1', dto, tenantAdmin);

    expect(organizations.update).toHaveBeenCalledWith('tenant-1', 'org-1', dto, 'admin-1');
  });

  it('rejects updating on a different tenant', () => {
    const dto = { legalName: 'Acme Kenya Ltd' };

    expect(() => controller.update('tenant-2', 'org-1', dto, tenantAdmin)).toThrow(ForbiddenException);
    expect(organizations.update).not.toHaveBeenCalled();
  });

  it('submits an organization for verification within the route tenant', () => {
    controller.submitForVerification('tenant-1', 'org-1', tenantAdmin);

    expect(organizations.submitForVerification).toHaveBeenCalledWith('tenant-1', 'org-1', 'admin-1');
  });

  it('rejects submitting for verification on a different tenant', () => {
    expect(() => controller.submitForVerification('tenant-2', 'org-1', tenantAdmin)).toThrow(ForbiddenException);
    expect(organizations.submitForVerification).not.toHaveBeenCalled();
  });

  it('requests a verification document upload URL within the route tenant', () => {
    const dto = { documentType: 'OTHER' as const, fileName: 'cert.pdf', contentType: 'application/pdf' };

    controller.requestVerificationDocumentUpload('tenant-1', 'org-1', dto, tenantAdmin);

    expect(verificationDocuments.requestUpload).toHaveBeenCalledWith('tenant-1', 'org-1', dto, 'admin-1');
  });

  it('resolves a verification document view URL within the route tenant', async () => {
    verificationDocuments.getViewUrl.mockResolvedValue('https://storage.example/view');

    const result = await controller.getVerificationDocumentViewUrl('tenant-1', 'doc-1', tenantAdmin);

    expect(result).toEqual({ viewUrl: 'https://storage.example/view' });
    expect(verificationDocuments.getViewUrl).toHaveBeenCalledWith('tenant-1', 'doc-1');
  });
});
