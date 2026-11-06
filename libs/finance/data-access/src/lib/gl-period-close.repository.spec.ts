import { PrismaService } from '@africahr/platform-database';
import { GlPeriodCloseRepository } from './gl-period-close.repository';

describe('GlPeriodCloseRepository', () => {
  let repository: GlPeriodCloseRepository;
  let tx: { glPeriodClose: { findFirst: jest.Mock; upsert: jest.Mock } };
  let prisma: { withTenantContext: jest.Mock };

  beforeEach(() => {
    tx = { glPeriodClose: { findFirst: jest.fn(), upsert: jest.fn() } };
    prisma = { withTenantContext: jest.fn((_tenantId, fn) => fn(tx)) };
    repository = new GlPeriodCloseRepository(prisma as unknown as PrismaService);
  });

  describe('findByOrganization', () => {
    it('scopes the lookup to the tenant and organization', async () => {
      await repository.findByOrganization('tenant-1', 'org-1');

      expect(tx.glPeriodClose.findFirst).toHaveBeenCalledWith({
        where: { tenantId: 'tenant-1', organizationId: 'org-1' },
      });
    });
  });

  describe('upsert', () => {
    it('creates or updates the single row for an organization, keyed by organizationId', async () => {
      const closedThrough = new Date('2026-01-31');
      tx.glPeriodClose.upsert.mockResolvedValue({ organizationId: 'org-1', closedThrough });

      const result = await repository.upsert('tenant-1', 'org-1', closedThrough, 'user-1');

      expect(tx.glPeriodClose.upsert).toHaveBeenCalledWith({
        where: { organizationId: 'org-1' },
        create: { tenantId: 'tenant-1', organizationId: 'org-1', closedThrough, closedBy: 'user-1' },
        update: { closedThrough, closedBy: 'user-1' },
      });
      expect(result.closedThrough).toEqual(closedThrough);
    });
  });
});
