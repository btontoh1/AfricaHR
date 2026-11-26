import { PrismaService } from '@africahr/platform-database';
import { AnnouncementRepository } from './announcement.repository';

describe('AnnouncementRepository', () => {
  let repository: AnnouncementRepository;
  let announcementDelegate: { findFirst: jest.Mock; findMany: jest.Mock; create: jest.Mock; update: jest.Mock };
  let organizationDelegate: { findFirst: jest.Mock };
  let organizationUnitDelegate: { findFirst: jest.Mock };
  let withTenantContext: jest.Mock;
  let prisma: {
    announcement: typeof announcementDelegate;
    organization: typeof organizationDelegate;
    organizationUnit: typeof organizationUnitDelegate;
    withTenantContext: jest.Mock;
  };

  beforeEach(() => {
    announcementDelegate = { findFirst: jest.fn(), findMany: jest.fn(), create: jest.fn(), update: jest.fn() };
    organizationDelegate = { findFirst: jest.fn() };
    organizationUnitDelegate = { findFirst: jest.fn() };
    withTenantContext = jest.fn((_tenantId, fn) =>
      fn({ announcement: announcementDelegate, organization: organizationDelegate, organizationUnit: organizationUnitDelegate }),
    );
    prisma = {
      announcement: announcementDelegate,
      organization: organizationDelegate,
      organizationUnit: organizationUnitDelegate,
      withTenantContext,
    };

    repository = new AnnouncementRepository(prisma as unknown as PrismaService);
  });

  describe('create', () => {
    it('writes every field, defaulting pinned to false', async () => {
      announcementDelegate.create.mockResolvedValue({ id: 'announcement-1' });

      await repository.create({
        tenantId: 'tenant-1',
        title: 'Office closed Friday',
        body: 'The office will be closed for the public holiday.',
        audienceScope: 'TENANT',
        createdBy: 'actor-1',
      });

      expect(withTenantContext).toHaveBeenCalledWith('tenant-1', expect.any(Function));
      expect(announcementDelegate.create).toHaveBeenCalledWith({
        data: {
          tenantId: 'tenant-1',
          title: 'Office closed Friday',
          body: 'The office will be closed for the public holiday.',
          attachmentKey: undefined,
          attachmentFileName: undefined,
          audienceScope: 'TENANT',
          organizationId: undefined,
          organizationUnitId: undefined,
          pinned: false,
          createdBy: 'actor-1',
          updatedBy: 'actor-1',
        },
      });
    });
  });

  describe('setPinned', () => {
    it('updates the pinned flag', async () => {
      announcementDelegate.update.mockResolvedValue({ id: 'announcement-1', pinned: true });

      await repository.setPinned('tenant-1', 'announcement-1', true, 'actor-1');

      expect(announcementDelegate.update).toHaveBeenCalledWith({
        where: { id: 'announcement-1' },
        data: { pinned: true, updatedBy: 'actor-1' },
      });
    });
  });

  describe('listVisibleTo', () => {
    it('includes an ORGANIZATION_UNIT clause only when the employee has a unit', async () => {
      announcementDelegate.findMany.mockResolvedValue([]);

      await repository.listVisibleTo('tenant-1', { organizationId: 'org-1', organizationUnitId: null });

      const call = announcementDelegate.findMany.mock.calls[0][0];
      expect(call.where.OR).toEqual([
        { audienceScope: 'TENANT' },
        { audienceScope: 'ORGANIZATION', organizationId: 'org-1' },
      ]);
      expect(call.orderBy).toEqual([{ pinned: 'desc' }, { createdAt: 'desc' }]);
    });

    it('adds the ORGANIZATION_UNIT clause when the employee has a unit', async () => {
      announcementDelegate.findMany.mockResolvedValue([]);

      await repository.listVisibleTo('tenant-1', { organizationId: 'org-1', organizationUnitId: 'unit-1' });

      const call = announcementDelegate.findMany.mock.calls[0][0];
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
