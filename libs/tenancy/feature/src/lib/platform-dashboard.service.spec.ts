import { PerformanceFramework, Tenant } from '@prisma/client';
import { PrismaService } from '@africahr/platform-database';
import { RedisService } from '@africahr/platform-redis';
import { StorageService } from '@africahr/platform-storage';
import { PlatformDashboardService } from './platform-dashboard.service';
import { TenantService } from './tenant.service';

describe('PlatformDashboardService', () => {
  let service: PlatformDashboardService;
  let tenants: jest.Mocked<TenantService>;
  let prisma: jest.Mocked<PrismaService>;
  let redis: jest.Mocked<RedisService>;
  let storage: jest.Mocked<StorageService>;

  const tenant: Tenant = {
    id: 'tenant-1',
    name: 'Acme Ghana Ltd',
    slug: 'acme-ghana-ltd',
    status: 'TRIAL',
    country: 'GH',
    currency: 'GHS',
    timezone: 'Africa/Accra',
    logoStorageKey: null,
    performanceFramework: PerformanceFramework.STANDARD,
    enabledAddOns: [],
    createdAt: new Date(),
    updatedAt: new Date(),
    deletedAt: null,
    createdBy: null,
    updatedBy: null,
  };

  beforeEach(() => {
    tenants = {
      listRecent: jest.fn(),
      count: jest.fn(),
    } as unknown as jest.Mocked<TenantService>;

    prisma = {
      getDatabaseSizeBytes: jest.fn(),
    } as unknown as jest.Mocked<PrismaService>;

    redis = {
      ping: jest.fn(),
    } as unknown as jest.Mocked<RedisService>;

    storage = {
      getStorageUsage: jest.fn(),
    } as unknown as jest.Mocked<StorageService>;

    service = new PlatformDashboardService(tenants, prisma, redis, storage);
  });

  it('aggregates recent tenants, counts, storage usage, and health checks', async () => {
    tenants.listRecent.mockResolvedValue([tenant]);
    tenants.count.mockResolvedValue(1);
    prisma.getDatabaseSizeBytes.mockResolvedValue(1024);
    redis.ping.mockResolvedValue(true);
    storage.getStorageUsage.mockResolvedValue({ usedBytes: 2048, objectCount: 4 });

    const summary = await service.getSummary();

    expect(summary).toEqual({
      recentTenants: [tenant],
      totalTenants: 1,
      storage: { usedBytes: 2048, objectCount: 4 },
      databaseSizeBytes: 1024,
      health: { api: true, database: true, redis: true },
    });
    expect(tenants.listRecent).toHaveBeenCalledWith(5);
  });

  it('reports database unhealthy and nulls the size when the query fails, without failing the whole summary', async () => {
    tenants.listRecent.mockResolvedValue([]);
    tenants.count.mockResolvedValue(0);
    prisma.getDatabaseSizeBytes.mockRejectedValue(new Error('connection refused'));
    redis.ping.mockResolvedValue(true);
    storage.getStorageUsage.mockResolvedValue({ usedBytes: 0, objectCount: 0 });

    const summary = await service.getSummary();

    expect(summary.databaseSizeBytes).toBeNull();
    expect(summary.health.database).toBe(false);
  });

  it('nulls storage usage when the storage check fails, without failing the whole summary', async () => {
    tenants.listRecent.mockResolvedValue([]);
    tenants.count.mockResolvedValue(0);
    prisma.getDatabaseSizeBytes.mockResolvedValue(1024);
    redis.ping.mockResolvedValue(true);
    storage.getStorageUsage.mockRejectedValue(new Error('bucket unreachable'));

    const summary = await service.getSummary();

    expect(summary.storage).toBeNull();
  });

  it('reports redis unhealthy when ping fails', async () => {
    tenants.listRecent.mockResolvedValue([]);
    tenants.count.mockResolvedValue(0);
    prisma.getDatabaseSizeBytes.mockResolvedValue(1024);
    redis.ping.mockResolvedValue(false);
    storage.getStorageUsage.mockResolvedValue({ usedBytes: 0, objectCount: 0 });

    const summary = await service.getSummary();

    expect(summary.health.redis).toBe(false);
  });
});
