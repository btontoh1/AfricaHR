import { RequestUser, SystemRole } from '@africahr/platform-auth';
import { OrganizationVerificationController } from './organization-verification.controller';
import { OrganizationService } from './organization.service';
import { OrganizationVerificationDocumentService } from './organization-verification-document.service';

describe('OrganizationVerificationController', () => {
  let controller: OrganizationVerificationController;
  let organizations: jest.Mocked<OrganizationService>;
  let verificationDocuments: jest.Mocked<OrganizationVerificationDocumentService>;

  const platformAdmin: RequestUser = {
    sub: 'platform-admin-1',
    email: 'admin@africahr.local',
    role: SystemRole.PLATFORM_ADMIN,
    tenantId: null,
    organizationId: null,
    iat: 1,
    exp: 2,
  };

  beforeEach(() => {
    organizations = {
      listPendingVerification: jest.fn(),
      verify: jest.fn(),
      reject: jest.fn(),
    } as unknown as jest.Mocked<OrganizationService>;

    verificationDocuments = {
      getViewUrlAcrossTenants: jest.fn(),
      listByOrganizationAcrossTenants: jest.fn(),
    } as unknown as jest.Mocked<OrganizationVerificationDocumentService>;

    controller = new OrganizationVerificationController(organizations, verificationDocuments);
  });

  it('lists organizations pending review, unscoped by tenant', async () => {
    await controller.list();

    expect(organizations.listPendingVerification).toHaveBeenCalledWith();
  });

  it('verifies an organization by id, regardless of tenant', () => {
    controller.verify('org-1', platformAdmin);

    expect(organizations.verify).toHaveBeenCalledWith('org-1', 'platform-admin-1');
  });

  it('rejects an organization by id with a note, regardless of tenant', () => {
    controller.reject('org-1', { note: 'Missing tax clearance' }, platformAdmin);

    expect(organizations.reject).toHaveBeenCalledWith('org-1', 'Missing tax clearance', 'platform-admin-1');
  });

  it('resolves a document view URL without a tenant filter', async () => {
    verificationDocuments.getViewUrlAcrossTenants.mockResolvedValue('https://storage.example/view');

    const result = await controller.getDocumentViewUrl('doc-1');

    expect(result).toEqual({ viewUrl: 'https://storage.example/view' });
    expect(verificationDocuments.getViewUrlAcrossTenants).toHaveBeenCalledWith('doc-1');
  });

  it('lists an organization’s documents without a tenant filter', () => {
    controller.listDocuments('org-1');

    expect(verificationDocuments.listByOrganizationAcrossTenants).toHaveBeenCalledWith('org-1');
  });
});
