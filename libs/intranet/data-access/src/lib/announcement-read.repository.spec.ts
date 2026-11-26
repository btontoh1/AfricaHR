import { PrismaService } from '@africahr/platform-database';
import { AnnouncementReadRepository } from './announcement-read.repository';

describe('AnnouncementReadRepository', () => {
  let repository: AnnouncementReadRepository;
  let delegate: { findFirst: jest.Mock; findMany: jest.Mock; create: jest.Mock };
  let withTenantContext: jest.Mock;
  let prisma: { announcementRead: typeof delegate; withTenantContext: jest.Mock };

  beforeEach(() => {
    delegate = { findFirst: jest.fn(), findMany: jest.fn(), create: jest.fn() };
    withTenantContext = jest.fn((_tenantId, fn) => fn({ announcementRead: delegate }));
    prisma = { announcementRead: delegate, withTenantContext };

    repository = new AnnouncementReadRepository(prisma as unknown as PrismaService);
  });

  it('findOne looks up by tenant, announcement and employee', async () => {
    delegate.findFirst.mockResolvedValue({ id: 'read-1' });

    const result = await repository.findOne('tenant-1', 'announcement-1', 'employee-1');

    expect(withTenantContext).toHaveBeenCalledWith('tenant-1', expect.any(Function));
    expect(delegate.findFirst).toHaveBeenCalledWith({
      where: { tenantId: 'tenant-1', announcementId: 'announcement-1', employeeId: 'employee-1' },
    });
    expect(result).toEqual({ id: 'read-1' });
  });

  it('create inserts a bare read row', async () => {
    delegate.create.mockResolvedValue({ id: 'read-1' });

    await repository.create('tenant-1', 'announcement-1', 'employee-1');

    expect(delegate.create).toHaveBeenCalledWith({
      data: { tenantId: 'tenant-1', announcementId: 'announcement-1', employeeId: 'employee-1' },
    });
  });

  it('listAnnouncementIdsReadByEmployee returns just the announcement ids', async () => {
    delegate.findMany.mockResolvedValue([{ announcementId: 'announcement-1' }, { announcementId: 'announcement-2' }]);

    const result = await repository.listAnnouncementIdsReadByEmployee('tenant-1', 'employee-1');

    expect(delegate.findMany).toHaveBeenCalledWith({
      where: { tenantId: 'tenant-1', employeeId: 'employee-1' },
      select: { announcementId: true },
    });
    expect(result).toEqual(['announcement-1', 'announcement-2']);
  });
});
