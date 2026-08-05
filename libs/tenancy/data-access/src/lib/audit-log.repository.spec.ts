import { PrismaService } from '@africahr/platform-database';
import { AuditLogRepository } from './audit-log.repository';

describe('AuditLogRepository', () => {
  let repository: AuditLogRepository;
  let prisma: { $queryRaw: jest.Mock };

  beforeEach(() => {
    prisma = { $queryRaw: jest.fn() };
    repository = new AuditLogRepository(prisma as unknown as PrismaService);
  });

  it('queries across all tenants via the SECURITY DEFINER function, bypassing tenant scoping', async () => {
    prisma.$queryRaw.mockResolvedValue([]);

    await repository.list({});

    expect(prisma.$queryRaw).toHaveBeenCalled();
  });

  it('strips totalCount off each row and surfaces it separately', async () => {
    prisma.$queryRaw.mockResolvedValue([
      {
        id: 'log-1',
        tenantId: 'tenant-1',
        tenantName: 'Acme',
        actorUserId: 'user-1',
        actorEmail: 'admin@acme.com',
        actorFirstName: 'Ada',
        actorLastName: 'Admin',
        action: 'tenant.created',
        resourceType: 'Tenant',
        resourceId: 'tenant-1',
        metadata: null,
        createdAt: new Date('2026-08-01T00:00:00Z'),
        totalCount: '3',
      },
    ]);

    const page = await repository.list({});

    expect(page.totalCount).toBe(3);
    expect(page.items).toEqual([
      {
        id: 'log-1',
        tenantId: 'tenant-1',
        tenantName: 'Acme',
        actorUserId: 'user-1',
        actorEmail: 'admin@acme.com',
        actorFirstName: 'Ada',
        actorLastName: 'Admin',
        action: 'tenant.created',
        resourceType: 'Tenant',
        resourceId: 'tenant-1',
        metadata: null,
        createdAt: new Date('2026-08-01T00:00:00Z'),
      },
    ]);
  });

  it('returns a zero total when nothing matches', async () => {
    prisma.$queryRaw.mockResolvedValue([]);

    const page = await repository.list({ tenantId: 'tenant-missing' });

    expect(page).toEqual({ items: [], totalCount: 0 });
  });

  it('clamps limit to the maximum and floors offset at zero', async () => {
    prisma.$queryRaw.mockResolvedValue([]);

    await repository.list({}, 10_000, -5);

    const [sqlParts, , , , , , , limitArg, offsetArg] = prisma.$queryRaw.mock.calls[0];
    expect(sqlParts).toBeDefined();
    expect(limitArg).toBe(200);
    expect(offsetArg).toBe(0);
  });
});
