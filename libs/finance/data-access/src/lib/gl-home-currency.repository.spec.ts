import { PrismaService } from '@africahr/platform-database';
import { GlHomeCurrencyRepository } from './gl-home-currency.repository';

describe('GlHomeCurrencyRepository', () => {
  let repository: GlHomeCurrencyRepository;
  let tx: { glHomeCurrency: { upsert: jest.Mock; findFirst: jest.Mock } };
  let prisma: { withTenantContext: jest.Mock };

  beforeEach(() => {
    tx = { glHomeCurrency: { upsert: jest.fn(), findFirst: jest.fn() } };
    prisma = { withTenantContext: jest.fn((_tenantId, fn) => fn(tx)) };
    repository = new GlHomeCurrencyRepository(prisma as unknown as PrismaService);
  });

  describe('upsert', () => {
    it('creates or updates the row keyed by organizationId', async () => {
      tx.glHomeCurrency.upsert.mockResolvedValue({ id: 'hc-1' });

      await repository.upsert('tenant-1', 'org-1', 'GHS', 'user-1');

      expect(tx.glHomeCurrency.upsert).toHaveBeenCalledWith({
        where: { organizationId: 'org-1' },
        create: { tenantId: 'tenant-1', organizationId: 'org-1', currency: 'GHS', updatedBy: 'user-1' },
        update: { currency: 'GHS', updatedBy: 'user-1' },
      });
    });
  });

  describe('findByOrganization', () => {
    it('scopes the lookup to the tenant and organization', async () => {
      await repository.findByOrganization('tenant-1', 'org-1');

      expect(tx.glHomeCurrency.findFirst).toHaveBeenCalledWith({
        where: { tenantId: 'tenant-1', organizationId: 'org-1' },
      });
    });
  });
});
