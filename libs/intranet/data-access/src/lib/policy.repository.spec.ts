import { PrismaService } from '@africahr/platform-database';
import { PolicyRepository } from './policy.repository';

describe('PolicyRepository', () => {
  let repository: PolicyRepository;
  let policyDelegate: { findFirst: jest.Mock; findMany: jest.Mock; create: jest.Mock };
  let organizationDelegate: { findFirst: jest.Mock };
  let organizationUnitDelegate: { findFirst: jest.Mock };
  let withTenantContext: jest.Mock;
  let prisma: {
    policy: typeof policyDelegate;
    organization: typeof organizationDelegate;
    organizationUnit: typeof organizationUnitDelegate;
    withTenantContext: jest.Mock;
  };

  beforeEach(() => {
    policyDelegate = { findFirst: jest.fn(), findMany: jest.fn(), create: jest.fn() };
    organizationDelegate = { findFirst: jest.fn() };
    organizationUnitDelegate = { findFirst: jest.fn() };
    withTenantContext = jest.fn((_tenantId, fn) =>
      fn({ policy: policyDelegate, organization: organizationDelegate, organizationUnit: organizationUnitDelegate }),
    );
    prisma = {
      policy: policyDelegate,
      organization: organizationDelegate,
      organizationUnit: organizationUnitDelegate,
      withTenantContext,
    };

    repository = new PolicyRepository(prisma as unknown as PrismaService);
  });

  describe('create', () => {
    it('writes every field, including the optional ones', async () => {
      policyDelegate.create.mockResolvedValue({ id: 'policy-1' });

      await repository.create({
        tenantId: 'tenant-1',
        title: 'Leave Policy',
        folder: 'Leave',
        storageKey: 'policies/tenant-1/leave.pdf',
        fileName: 'leave.pdf',
        version: 1,
        audienceScope: 'TENANT',
        createdBy: 'actor-1',
      });

      expect(withTenantContext).toHaveBeenCalledWith('tenant-1', expect.any(Function));
      expect(policyDelegate.create).toHaveBeenCalledWith({
        data: {
          tenantId: 'tenant-1',
          title: 'Leave Policy',
          folder: 'Leave',
          storageKey: 'policies/tenant-1/leave.pdf',
          fileName: 'leave.pdf',
          version: 1,
          supersedesId: undefined,
          audienceScope: 'TENANT',
          organizationId: undefined,
          organizationUnitId: undefined,
          createdBy: 'actor-1',
          updatedBy: 'actor-1',
        },
      });
    });
  });

  describe('listVisibleTo', () => {
    it('includes an ORGANIZATION_UNIT clause only when the employee has a unit', async () => {
      policyDelegate.findMany.mockResolvedValue([]);

      await repository.listVisibleTo('tenant-1', { organizationId: 'org-1', organizationUnitId: null });

      const call = policyDelegate.findMany.mock.calls[0][0];
      expect(call.where.OR).toEqual([
        { audienceScope: 'TENANT' },
        { audienceScope: 'ORGANIZATION', organizationId: 'org-1' },
      ]);
    });

    it('adds the ORGANIZATION_UNIT clause when the employee has a unit', async () => {
      policyDelegate.findMany.mockResolvedValue([]);

      await repository.listVisibleTo('tenant-1', { organizationId: 'org-1', organizationUnitId: 'unit-1' });

      const call = policyDelegate.findMany.mock.calls[0][0];
      expect(call.where.OR).toEqual([
        { audienceScope: 'TENANT' },
        { audienceScope: 'ORGANIZATION', organizationId: 'org-1' },
        { audienceScope: 'ORGANIZATION_UNIT', organizationUnitId: 'unit-1' },
      ]);
    });
  });

  describe('organizationExistsInTenant', () => {
    it('returns true when visible under that tenant context', async () => {
      organizationDelegate.findFirst.mockResolvedValue({ id: 'org-1' });
      expect(await repository.organizationExistsInTenant('tenant-1', 'org-1')).toBe(true);
    });

    it('returns false when not found', async () => {
      organizationDelegate.findFirst.mockResolvedValue(null);
      expect(await repository.organizationExistsInTenant('tenant-1', 'org-9')).toBe(false);
    });
  });

  describe('organizationUnitExistsInTenant', () => {
    it('returns true when visible under that tenant context', async () => {
      organizationUnitDelegate.findFirst.mockResolvedValue({ id: 'unit-1' });
      expect(await repository.organizationUnitExistsInTenant('tenant-1', 'unit-1')).toBe(true);
    });

    it('returns false when not found', async () => {
      organizationUnitDelegate.findFirst.mockResolvedValue(null);
      expect(await repository.organizationUnitExistsInTenant('tenant-1', 'unit-9')).toBe(false);
    });
  });
});
