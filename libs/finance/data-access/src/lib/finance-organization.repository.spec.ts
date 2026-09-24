import { PrismaService } from '@africahr/platform-database';
import { FinanceOrganizationRepository } from './finance-organization.repository';

describe('FinanceOrganizationRepository', () => {
  let repository: FinanceOrganizationRepository;
  let tx: { organization: { findFirst: jest.Mock } };
  let prisma: { withTenantContext: jest.Mock };

  beforeEach(() => {
    tx = { organization: { findFirst: jest.fn() } };
    prisma = { withTenantContext: jest.fn((_tenantId, fn) => fn(tx)) };
    repository = new FinanceOrganizationRepository(prisma as unknown as PrismaService);
  });

  describe('findById', () => {
    it('scopes the lookup to the tenant and excludes soft-deleted organizations', async () => {
      await repository.findById('tenant-1', 'org-1');

      expect(tx.organization.findFirst).toHaveBeenCalledWith({
        where: { id: 'org-1', tenantId: 'tenant-1', deletedAt: null },
        select: { id: true, legalName: true, address: true },
      });
    });
  });
});
