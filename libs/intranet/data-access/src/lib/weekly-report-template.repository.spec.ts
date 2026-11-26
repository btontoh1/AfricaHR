import { PrismaService } from '@africahr/platform-database';
import { WeeklyReportTemplateRepository } from './weekly-report-template.repository';

describe('WeeklyReportTemplateRepository', () => {
  let repository: WeeklyReportTemplateRepository;
  let templateDelegate: { findFirst: jest.Mock; findMany: jest.Mock; upsert: jest.Mock };
  let organizationUnitDelegate: { findFirst: jest.Mock };
  let withTenantContext: jest.Mock;
  let prisma: {
    weeklyReportTemplate: typeof templateDelegate;
    organizationUnit: typeof organizationUnitDelegate;
    withTenantContext: jest.Mock;
  };

  beforeEach(() => {
    templateDelegate = { findFirst: jest.fn(), findMany: jest.fn(), upsert: jest.fn() };
    organizationUnitDelegate = { findFirst: jest.fn() };
    withTenantContext = jest.fn((_tenantId, fn) =>
      fn({ weeklyReportTemplate: templateDelegate, organizationUnit: organizationUnitDelegate }),
    );
    prisma = { weeklyReportTemplate: templateDelegate, organizationUnit: organizationUnitDelegate, withTenantContext };

    repository = new WeeklyReportTemplateRepository(prisma as unknown as PrismaService);
  });

  describe('upsert', () => {
    it('creates when none exists yet', async () => {
      templateDelegate.upsert.mockResolvedValue({ id: 'template-1' });

      await repository.upsert({
        tenantId: 'tenant-1',
        organizationUnitId: 'unit-1',
        questions: ['Q1', 'Q2'],
        actorId: 'actor-1',
      });

      expect(withTenantContext).toHaveBeenCalledWith('tenant-1', expect.any(Function));
      expect(templateDelegate.upsert).toHaveBeenCalledWith({
        where: { organizationUnitId: 'unit-1' },
        create: {
          tenantId: 'tenant-1',
          organizationUnitId: 'unit-1',
          questions: ['Q1', 'Q2'],
          createdBy: 'actor-1',
          updatedBy: 'actor-1',
        },
        update: { questions: ['Q1', 'Q2'], updatedBy: 'actor-1' },
      });
    });
  });

  describe('findByOrganizationUnitId', () => {
    it('scopes by tenant and unit', async () => {
      templateDelegate.findFirst.mockResolvedValue(null);

      await repository.findByOrganizationUnitId('tenant-1', 'unit-1');

      expect(templateDelegate.findFirst).toHaveBeenCalledWith({
        where: { tenantId: 'tenant-1', organizationUnitId: 'unit-1', deletedAt: null },
      });
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
