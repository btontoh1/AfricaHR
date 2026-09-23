import { PrismaService } from '@africahr/platform-database';
import { DEFAULT_CHART_OF_ACCOUNTS, GlAccountCode } from '@africahr/finance-domain';
import { GlAccountRepository } from './gl-account.repository';

describe('GlAccountRepository', () => {
  let repository: GlAccountRepository;
  let tx: { glAccount: { upsert: jest.Mock; findMany: jest.Mock; update: jest.Mock } };
  let prisma: { withTenantContext: jest.Mock };

  beforeEach(() => {
    tx = { glAccount: { upsert: jest.fn(), findMany: jest.fn(), update: jest.fn() } };
    prisma = { withTenantContext: jest.fn((_tenantId, fn) => fn(tx)) };
    repository = new GlAccountRepository(prisma as unknown as PrismaService);
  });

  describe('ensureDefaultAccounts', () => {
    it('upserts every default account by (tenantId, code)', async () => {
      await repository.ensureDefaultAccounts('tenant-1');

      expect(tx.glAccount.upsert).toHaveBeenCalledTimes(DEFAULT_CHART_OF_ACCOUNTS.length);
      expect(tx.glAccount.upsert).toHaveBeenCalledWith({
        where: { tenantId_code: { tenantId: 'tenant-1', code: GlAccountCode.CASH_AND_BANK } },
        create: { tenantId: 'tenant-1', code: GlAccountCode.CASH_AND_BANK, name: 'Cash and Bank', type: 'ASSET' },
        update: {},
      });
    });
  });

  describe('mapCodesToIds', () => {
    it('resolves each code to its account id', async () => {
      tx.glAccount.findMany.mockResolvedValue([
        { id: 'acc-1', code: GlAccountCode.CASH_AND_BANK },
        { id: 'acc-2', code: GlAccountCode.REVENUE },
      ]);

      const map = await repository.mapCodesToIds('tenant-1', [
        GlAccountCode.CASH_AND_BANK,
        GlAccountCode.REVENUE,
      ]);

      expect(map.get(GlAccountCode.CASH_AND_BANK)).toBe('acc-1');
      expect(map.get(GlAccountCode.REVENUE)).toBe('acc-2');
    });

    it('throws when a requested code was never seeded for the tenant', async () => {
      tx.glAccount.findMany.mockResolvedValue([{ id: 'acc-1', code: GlAccountCode.CASH_AND_BANK }]);

      await expect(
        repository.mapCodesToIds('tenant-1', [GlAccountCode.CASH_AND_BANK, GlAccountCode.REVENUE]),
      ).rejects.toThrow(new RegExp(GlAccountCode.REVENUE));
    });
  });

  describe('updateName', () => {
    it('updates only the name, by id', async () => {
      tx.glAccount.update.mockResolvedValue({ id: 'acc-1', code: GlAccountCode.CASH_AND_BANK, name: 'Operating Account' });

      const result = await repository.updateName('tenant-1', 'acc-1', 'Operating Account');

      expect(tx.glAccount.update).toHaveBeenCalledWith({
        where: { id: 'acc-1' },
        data: { name: 'Operating Account' },
      });
      expect(result.name).toBe('Operating Account');
    });
  });
});
