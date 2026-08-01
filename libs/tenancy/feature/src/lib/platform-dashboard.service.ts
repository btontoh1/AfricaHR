import { Injectable, Logger } from '@nestjs/common';
import { Tenant } from '@prisma/client';
import { PrismaService } from '@africahr/platform-database';
import { RedisService } from '@africahr/platform-redis';
import { StorageService, StorageUsage } from '@africahr/platform-storage';
import { TenantService } from './tenant.service';

const RECENT_TENANTS_LIMIT = 5;

export interface PlatformDashboardSummary {
  recentTenants: Tenant[];
  totalTenants: number;
  storage: StorageUsage | null;
  databaseSizeBytes: number | null;
  health: { api: true; database: boolean; redis: boolean };
}

/**
 * Aggregates read-only operational metrics for the platform admin
 * dashboard - deliberately separate from HealthModule's /health endpoint,
 * which is public/unauthenticated (for infra load-balancer probes); this
 * one is gated (PLATFORM_TENANT_MANAGE) and returns richer data than an
 * infra probe should ever expose (tenant names, storage/DB sizes).
 */
@Injectable()
export class PlatformDashboardService {
  private readonly logger = new Logger(PlatformDashboardService.name);

  constructor(
    private readonly tenants: TenantService,
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
    private readonly storage: StorageService,
  ) {}

  async getSummary(): Promise<PlatformDashboardSummary> {
    const [recentTenants, totalTenants, databaseSizeBytes, redisUp, storage] = await Promise.all([
      this.tenants.listRecent(RECENT_TENANTS_LIMIT),
      this.tenants.count(),
      this.safeDatabaseSize(),
      this.redis.ping(),
      this.safeStorageUsage(),
    ]);

    return {
      recentTenants,
      totalTenants,
      storage,
      databaseSizeBytes,
      health: {
        // Reaching this line at all proves the API process handled the
        // request - there's no meaningful "down" state to check here.
        api: true,
        database: databaseSizeBytes !== null,
        redis: redisUp,
      },
    };
  }

  // Each metric degrades independently rather than taking down the whole
  // dashboard - a storage outage shouldn't hide the tenant list too.
  private async safeDatabaseSize(): Promise<number | null> {
    try {
      return await this.prisma.getDatabaseSizeBytes();
    } catch (error) {
      this.logger.warn(`Failed to read database size: ${(error as Error).message}`);
      return null;
    }
  }

  private async safeStorageUsage(): Promise<StorageUsage | null> {
    try {
      return await this.storage.getStorageUsage();
    } catch (error) {
      this.logger.warn(`Failed to read storage usage: ${(error as Error).message}`);
      return null;
    }
  }
}
